# Decision log

Why PlateRegion is built the way it is. Each entry records the decision, the reasoning and the alternatives that were rejected, so they don't get re-litigated or silently undone.

Statuses: **Accepted** — in effect; **Planned** — agreed, not implemented yet; **Open** — to be decided at the noted point; **Superseded** — replaced by the decision named in its heading; kept for history.

When a decision changes, update its entry and status instead of deleting it.

---

## Product and architecture

### D-01 No lookup backend; lookup runs on the device — Accepted

The plate registry is small and almost never changes, so the whole lookup (parsing + registry) is bundled into the app and runs in the browser, including offline.
Lookup never needs server-side code. Server-side code is limited to the cloud OCR fallback serverless function (D-04), needed solely to keep the vision API key secret, and the planned Node API (D-30); neither is a lookup dependency.

- **Why:** instant results, offline support for the PWA, nothing to operate, near-zero hosting cost.
- **Rejected:** a lookup API (adds latency, breaks offline mode, needs hosting); NestJS or BaaS as a lookup backend (no data to store server-side).

### D-02 Prerender instead of runtime SSR — Planned (Epic 3)

Region pages (`/wa`, `/kr`, …) are generated at build time from the registry, then hydrated.

- **Why:** a few hundred static pages cover SEO fully; no Node runtime is needed.
- **Rejected:** runtime SSR (needs a server for content that never changes). Remains possible later; the hosting supports it.

### D-03 Hosting on Vercel — Accepted

Git integration with `nick-yermak/plate-region`: preview deployment per pull request, production deployment on every push to `main` (https://plate-region.vercel.app). No deploy step in GitHub Actions, no Vercel token in secrets, and the Vercel deployment is not a required status check (D-16).

Build settings live in root `vercel.json` (`installCommand`, `buildCommand`, `outputDirectory`); those fields override Project Settings for each deployment, so dashboard Build/Output/Install overrides stay off. `buildCommand` starts with `node -v && npm -v` so every build log records the Node and npm versions in use (JSON has no comments). Dashboard retains Root Directory `./`, Framework Preset Angular, and Deployment Protection Standard (previews require a Vercel login).

- **Why:** preview deploys per PR, serverless functions for D-04, static hosting for prerendered pages; build config reproducible from the repo (D-19).
- **Rejected:** Netlify (initially chosen, switched by preference; technically equivalent for this project); deploy from Actions with a Vercel token (extra secret, duplicates Git integration); build settings only in the dashboard (invisible in review, drifts from `project.json`).
- **Not set up:** SPA rewrites, prerender/SSR, Ignored Build Step based on `nx affected`, function region, Deployment Protection bypass for e2e, custom domain, Speed Insights.

### D-04 Hybrid photo recognition — Planned (Epic 4)

Local OCR first (Tesseract.js in a Web Worker); fall back to a cloud vision model only when confidence is low. Confidence = OCR confidence + validation by the domain library (does the prefix exist). The user confirms or corrects the result. Photos are never stored.

- **Why:** most photos are handled for free and offline; the cloud covers hard cases.
- **Rejected:** cloud-only (cost, no offline, privacy); a custom ML model (too much effort for the gain).

### D-05 Framework-free core libraries — Accepted

`libs/plate-data` holds the registry (single source of truth for codes); `libs/plate-domain` holds the parsing logic and may depend on `plate-data`. Both are pure TypeScript.

- **Why:** reused by four consumers — the Angular app, the serverless function (D-04), the custom MCP server (Epic 7) and the planned Node API (D-30); fast TDD without TestBed; unaffected by Angular upgrades.
- **Rejected:** Angular libraries or services (would tie the logic to the framework and block reuse).

### D-06 Module boundaries enforced by Nx tags — Accepted

| Project        | Tag           | May depend on              |
| -------------- | ------------- | -------------------------- |
| `web`          | `type:app`    | `type:domain`, `type:data` |
| `web-e2e`      | `type:e2e`    | `type:domain`, `type:data` |
| `plate-domain` | `type:domain` | `type:data`                |
| `plate-data`   | `type:data`   | —                          |

`@angular/*` imports are banned in `type:domain` and `type:data` via `bannedExternalImports`. The default wildcard constraint (`*` → `*`) is intentionally absent — re-adding it disables all rules. E2E may use the registry to assert real regions instead of hardcoded strings.

### D-07 Country-ready data model, no multi-country abstraction yet — Accepted

- `country: 'PL'` in registry records and parse results.
- Polish logic lives in a `pl/` folder behind each library's public API.
- Public types use neutral region levels (`region1` = voivodeship, `region2` = powiat or city); voivodeship/powiat terms stay inside `pl/`. Values may be Polish.

- **Why:** adding Germany, Czechia etc. later becomes additive, and stored collections need no data migration.
- **Rejected:** a generic "country parser" interface now — with one country we can't know the right abstraction (German plates are ambiguous without separators, Czech encode the region in the second position, Lithuanian don't encode it at all).

**Registry model** (`libs/plate-data/src/lib/pl/model.ts`, mirrors Annex 13, D-26):

- Region1: `ordinal` (Lp. in Annex 13), lowercase official name (D-26, typed as `Lowercase<string>`), English name marked `origin: 'unofficial'`, column-4 letters as a one- or two-element tuple with the primary letter first, column-6 letter+digit codes.
- Region2: name as in the act, explicit `kind: 'city' | 'land'` (miasto na prawach powiatu / powiat ziemski; capitalisation is not a reliable signal — `m.st. Warszawa`), `region1Letter` (the primary letter of its region1), column-5 suffixes as a non-empty tuple in Annex 13 order. Names repeat across voivodeships, so a name is not a key. The validator (#33) checks that every `region1Letter` is the primary letter of an existing region1.
- Storage: a TypeScript constant generated by the import (D-26), checked with `as const satisfies Registry`, so `typecheck` (D-13) validates every record without casts. The file has a "generated, do not edit by hand" header and is committed Prettier-formatted. This deviates from "as JSON" in `docs/backlog.md`; consumers that need JSON (e.g. the MCP resource, Epic 7) serialise it. **Rejected:** JSON (typed records only through casts or a runtime schema).
- Full codes are derived (each region1 letter + each suffix), not stored, so the data mirrors columns 4 and 5 one-to-one and cannot drift. The derivation is one small pure function in plate-data (a registry fact, not parsing), shared by the validator and the plate-domain index, added with #33. Codes are unique on full codes, not on suffixes (`PL` is in four voivodeships: polkowicki, płocki, pleszewski, policki); the validator (#33) checks it. **Rejected:** stored full codes (duplicate columns 4 × 5 and can drift).
- Provenance is registry-level only: `legalStateDate` (ISO `YYYY-MM-DD`, a plain `string`; the validator (#33) checks format and date validity) and ordered `sources` of `{ act, provision }` — order matters because amendments apply in sequence (D-26). Values come from the import (#34). Per-change traceability lives in the import's patch list and git history. **Rejected:** per-code provenance (duplicates the patch list in every record).
- Stable region2 identifier: the primary full code (primary region1 letter + first suffix in Annex 13 order), derived, not stored. Used by collection storage (Epic 5) and `/:code` routes (Epic 3). **Assumption:** amendments only append letters and suffixes, and merged or split powiats keep their codes (§ 31 ust. 4–5), so the primary code never changes — codes are therefore not 1:1 with administrative units. An amendment that removes or reorders a primary code reopens this decision.
- Not in the registry: the 25-letter alphabet (§ 30 ust. 1) and the five plate types (§ 25) are parsing concepts in plate-domain (#35, #38). The amendments restrict nothing by plate type, so records have no plate-type field.

### D-08 Region collection stored only on the device — Planned (Epic 5)

IndexedDB, no accounts; export/import as JSON to survive a phone change.

- **Why:** privacy, no backend (D-01).
- **Rejected:** accounts and sync (kept as a later idea).

### D-09 Polish and English UI — Accepted; i18n library Open (Epic 2)

Built-in Angular i18n (per-locale builds, fits prerender) vs Transloco (runtime switching) — decide after a small prototype in Epic 2.

### D-30 Node API as an additional consumer — Planned (Epic 9, after Epic 3)

A Node API in `apps/api` reuses `plate-domain` and `plate-data` (D-05). Every client keeps lookup on the device; web never depends on the API for lookup (offline PWA, D-01).

- **Why:** learning backend development; an API for a future native iOS client and for external consumers; later a home for the D-04 OCR function and for any stateful features (accounts, sync, leaderboard).
- **Open:** framework (NestJS vs Fastify/Hono); hosting (Vercel functions vs a long-running server); Nx tag (`type:app` vs a new tag — a new tag needs its own decision, per `nx.mdc`).
- **Rejected:** lookup via the API (breaks offline, D-01). A React app or a React Native/Expo client imports the libraries directly; the API is needed only for clients that cannot run TypeScript (native Swift).

---

## Frontend

### D-10 Modern Angular defaults — Accepted

Standalone components, signals, Signal Forms, `resource`/`httpResource`, new control flow, OnPush (the default in Angular 22 — never opt into `Eager`).
Zoneless is the default in this Angular version: there is no `zone.js` and no `provideZonelessChangeDetection()` — do not add either.

### D-11 Tailwind with plain CSS — Superseded by D-28

Tailwind is configured through CSS; no SCSS. Mobile-first responsive layout, light/dark theme via design tokens.

### D-28 UI library and styling: NG-ZORRO with Less — Accepted

Supersedes D-11. UI components come from NG-ZORRO (`ng-zorro-antd` 22.x). Less is used for the global theme and for our own component styles. No Tailwind, no SCSS. Mobile-first stays.

- `ng-zorro-antd` keeps its major version in sync with `@angular/core`; 22.x supports Angular `^22`. It supports zoneless and OnPush (D-10). Components are imported per subpath (e.g. `ng-zorro-antd/button`). Its theme is written in Less.
- Theming goes through NG-ZORRO's Less variables: overrides, a dark theme built from its dark-theme variables, and per-component style imports instead of the full library CSS.
- Signal Forms remain the rule (D-10): `nz-input` is a directive on a native input and binds natively; ControlValueAccessor-based components (`nz-select`, `nz-autocomplete`, …) bind through Angular's ControlValueAccessor interop.

- **Why:** the registry browser needs a filterable, sortable data table over all registry codes, plus form and feedback components.
- **Rejected:** Tailwind with hand-written components (a filterable data table is too much custom work); SCSS (cannot customise the NG-ZORRO Less theme); Less and SCSS together (two preprocessors, two variable systems); plain CSS with the prebuilt NG-ZORRO builds (no theme customisation, full library CSS).
- **Open (Epic 2):** light/dark runtime switching. Less variables exist only at compile time, so the options are swapping two compiled stylesheets or CSS custom properties (NG-ZORRO's CSS-variable build is experimental).
- **To verify in the first Epic 2 prototype:** prerender/hydration behaviour; whether the Angular build needs the `less` package; NG-ZORRO's own locale system must follow the D-09 choice.
- **Update (#86):** `ng-zorro-antd` 22.1.2 (`~22.1.2`), `@angular/cdk` `~22.2.1` listed explicitly next to the Angular family, and `less` `^4.9.1` as a dev dependency (`@angular/build` loads it via `require('less')`; its optional peer range is `^4.2.0`). Light/dark switching follows NG-ZORRO's documented "Theme Dynamic Switching": two global Less entries compiled as non-injected bundles (`"inject": false`, `bundleName` `light` and `dark`), each importing core styles and only the components we use from one shared list; an inline script in `index.html` picks the theme before bootstrap (stored choice, else `prefers-color-scheme`) and adds the `<link>`; a theme service swaps it at runtime. Each theme bundle defines app-level CSS custom properties from its Less variables, so component styles stay theme-agnostic and never import NG-ZORRO Less. **Rejected:** the CSS-variable build (experimental, primary colours only, no dark theme); one bundle with both themes scoped by class (double size, undocumented). Prerender/hydration: `web` has no SSR or prerender today — re-check when D-09 adds prerendered locales. NG-ZORRO's locale defaults to `zh_CN` when no `NZ_I18N` is provided, so `web` provides `en_US` as its default NG-ZORRO locale; #89 switches it together with the UI language (D-09) — `pl_PL`, `en_US` and `ru_RU` ship in `ng-zorro-antd/i18n`.

### D-29 Charts library — Open (Epic 2)

Charts such as plate variants per region1 in the registry browser.

- **Leaning:** Apache ECharts used directly behind a thin in-house wrapper component: rendered only in `afterNextRender`, loaded via `@defer`, kept in sync with `effect`.
- **To evaluate:** AntV G2; ready-made Angular wrappers (check Angular 22 support); D3 (too low-level for bar charts); Highcharts (commercial licence).
- Chart data is computed by pure functions in `plate-domain`, not in components. Variant counts per code and per region1: D-43.

---

## Testing

### D-12 Two Vitest runners, each where it fits — Accepted

- `web`: Angular's built-in unit-test builder (`@angular/build:unit-test`, Vitest runner).
- Libraries: `@nx/vitest`.
- Libraries resolve tsconfig path mappings with Vite's native `resolve.tsconfigPaths` (experimental in Vite 8). **Rejected:** `nxViteTsPaths` / `nxCopyAssetsPlugin` (deprecated, removed in Nx v24; the copy plugin has no effect in tests), `vite-tsconfig-paths` (Vite itself warns it is redundant). Fallback if the option changes: `vite-tsconfig-paths`, with approval.

- **Why:** the built-in builder is the official Angular path, compiling tests with the same toolchain as the app; plain TypeScript libraries don't need Angular compilation.
- **Rejected:** `@nx/vitest` for the app (needs a third-party Vite plugin for Angular — more moving parts).
- Unit tests don't run in watch mode in CI because the builder detects `CI=true`.

### D-13 Type checking as its own target — Accepted

Libraries have a `typecheck` target (`tsc --noEmit` for lib and spec tsconfigs, defined once in `targetDefaults`). Vitest strips types without checking them, and the libraries have no `build`, so without this target nothing in CI checks their types.

- **Rejected:** the `@nx/js/typescript` plugin — it targets TS project references, while this workspace uses tsconfig path mappings.

`plate-data` overrides the default command to also run `tsc --noEmit -p tsconfig.scripts.json` (the Annex 13 import script, D-26). A change to the `targetDefaults` command must be mirrored in that override.

Because Vitest strips types without checking them, a red test run at the TDD checkpoint does not show that the spec compiles. The checkpoint has a stub with the final types, so `typecheck` passing there shows the spec compiles (`testing.mdc`). In #36 a type error in the spec surfaced only because `typecheck` was run by hand before the implementation.

### D-14 E2E browsers — Accepted (Chromium) / Planned (Epic 6)

Now: Chromium only, to keep CI fast while the app is a placeholder.
Epic 6: Desktop Chrome + iPhone (WebKit) — every iOS browser runs on WebKit, and PWA install, offline mode and camera behave differently there. Firefox is not needed for this audience.

---

## Tooling and workflow

### D-15 Toolchain — Accepted

- **Nx monorepo** (vs Angular CLI workspace or pnpm workspaces): shared libraries, `nx affected`, module boundaries, Nx MCP.
- **Node 24** via fnm, pinned in `.nvmrc` — source of truth for developers, agents and CI (`setup-node` reads it). Vercel does not read `.nvmrc`; it uses `engines.node` in `package.json` (then Project Settings, then its default). Keep `engines.node` on the same major as `.nvmrc` (e.g. `24.x`). `.npmrc` has `engine-strict=true` so `npm ci` fails with `EBADENGINE` if they diverge — CI's required `checks`/`e2e` jobs catch that without changing `ci.yml`.
- **npm**, with install scripts explicitly approved (`allowScripts` in `package.json`). On npm 11 the field is advisory (unreviewed scripts still run; npm prints a notice); npm 12 blocks them by default. Vercel's npm 11.19.0 (with Node 24) reads `allowScripts`, and the allowlist covers every install script on Vercel's Linux build (no uncovered-scripts warning).
- **Never** `--legacy-peer-deps` or `npm audit fix --force`: they hide or force past real incompatibilities. Fix the cause instead (e.g. a clean reinstall for a corrupted lockfile).
- Dev-only advisories pinned inside a tool are accepted when the vulnerable code path is not used; re-check on every tool upgrade. No `overrides` without approval.
  - Accepted in #28: `undici@7.29.0`, pinned exactly by `nx` 23.3.x and 24.0.x (nrwl/nx#37331). `nx` loads it only when `HTTP(S)_PROXY` or `ALL_PROXY` is set, for Nx Cloud and `nx release` HTTP calls (`dist/src/utils/http-client.js`); this workspace sets no proxy and uses neither. Drop this entry once `nx` pins `undici` ≥ 7.30.1.
- Upgrading an exact-pinned peer group with an existing lockfile fails with `ERESOLVE`, even when all packages are named in one install: seen for the Angular family on npm 11 and for `@nx/*` during `nx migrate` on npm 12.2 (#28). Regenerating `package-lock.json` is then allowed with explicit approval, and the PR lists the notable version changes.
- **ESLint 10** with inferred lint targets (`@nx/eslint/plugin`); Prettier for formatting.

### D-16 Git and GitHub workflow — Accepted

- Kanban in **GitHub Projects** (vs Trello or Linear): issues, PRs and the board live next to the code and are reachable by agents via GitHub MCP.
- Issues are created per epic when the epic starts, all at once from `docs/backlog.md`. Later epics have a milestone and an Epic field option but no issues. **Why:** a partly filled epic misrepresents its scope, and backlog lines still change before an epic starts (e.g. PR #50).
- All changes go through PRs; **squash merge only**, with the PR title as the commit message — so PR titles must be Conventional Commits.
- `main` is protected by a ruleset: PR required (0 approvals — solo developer), required checks `checks`, `e2e`, `pr-title`, no force pushes or deletion. Head branches are deleted automatically.
- Commits use the GitHub noreply email. No AI attribution in history: the `commit-msg` hook strips `cursoragent@cursor.com` trailers.
- Branch first, then commit.
- The repository and the Projects board are public: the project is built in public, and rulesets on GitHub Free require a public repository.

### D-17 Git hooks are fast; CI is authoritative — Accepted

- `pre-commit`: lint-staged only (ESLint `--fix`, then Prettier, on staged files). No tests or builds.
- `commit-msg`: strip AI trailers, then commitlint (`config-conventional` + `config-nx-scopes`; scope optional).
- **Why:** slow hooks get bypassed with `--no-verify`; hooks can be skipped anyway, so CI decides.

### D-18 CI on GitHub Actions — Accepted

- `ci.yml`: jobs `checks` (format check, then affected lint, test, build, typecheck) and `e2e` (affected e2e; Chromium installed only when e2e is affected, so the required check never hangs).
- `pr-title.yml`: validates the PR title with the same `commitlint.config.mjs`.
- `nx affected` with full history and `nrwl/nx-set-shas`; Node from `.nvmrc`; npm cache via `setup-node`; local Nx cache via `actions/cache`.
- In-progress runs are cancelled only for PRs — runs on `main` must complete, because `nx-set-shas` uses the last successful one as the base.
- Minimal token permissions (`contents: read`, `actions: read`). No Nx Cloud.
- Both core libraries (`plate-domain`, `plate-data`) enforce 100% lines and branches in their own `vitest.config.mts` (`coverage.enabled`, `coverage.include: ['src/**/*.ts']`, `thresholds`); there are no coverage exclusions, and plate-data's generated `src/lib/pl/registry.ts` is included. Without `include`, Vitest 4 counts only files loaded by tests. **Why:** one place per library, so `test` behaves the same locally and in CI and `ci.yml` stays unchanged. **Rejected:** `nx affected -t test --coverage` (the flag also reaches `web`). The atomized `test-ci--*` targets run one spec file each, so they fail the threshold once plate-domain has more than one source file; use `test`.
- 100% branches does not prove that every condition operand matters: Vitest v8 coverage counts an operand of `||`, `&&`, `??` or an optional chain as covered once it is evaluated, not once it changes the outcome. In #37 (PR #58), `!BY_LETTER.has(...)` and `PLATE_ALPHABET.has(char)` in `matchesUnregisteredShape` could never be satisfied by real data and still showed as covered. Such an operand is a branch real data cannot reach in disguise, so it is removed rather than covered with synthetic input (`testing.mdc`).
- A test that calls an internal function only to cover a branch is the same failure mode: the public API cannot reach it with real data, so the branch is removed rather than covered. Exception: data-integrity guards that throw while a module builds its indexes (`testing.mdc`). Caught by hand in #39.

### D-37 No non-null assertions in production code — Accepted

`@typescript-eslint/no-non-null-assertion` is `error` for production TypeScript in the root `eslint.config.mjs`; `*.spec.ts` and `*.test.ts` are excluded. No `eslint-disable` for this rule. A `!` is removed by a type that guarantees the value (a non-empty tuple `readonly [T, ...T[]]`), by narrowing the code needs for real data anyway, or by restructuring — never by a `?.`, `??` or `if` fallback that real data cannot reach (D-18).

- The rule was already on at `warn` through `nx.configs['flat/typescript']`. Warnings do not fail `lint`, so five `!` in plate-domain passed in #37 (PR #58), each a hidden "what if undefined" branch with no code to cover (D-18). The import script (#34) avoids them with `expectDefined`. When this was decided (#59), production and spec code had no `!`.
- `files` uses `**/*.ts` (and `.tsx`, `.cts`, `.mts`), not `libs/**`: Nx runs `eslint .` from the project folder with the project's `eslint.config.mjs`, which spreads the root array, so patterns resolve relative to the project and `libs/**` would match nothing. Every lint target is a project under `libs/` or `apps/`.
- Specs are excluded: a wrong `!` in a spec throws or fails an assertion, so the test fails loudly; in production it hides a branch. Specs keep the preset's `warn`.
- `noUncheckedIndexedAccess` stays off. Measured in #59: plate-domain `tsconfig.lib.json` 6 errors (`tsconfig.spec.json` reports the same 6 through imports); plate-data lib, spec and scripts 0; web app and spec 0. All six read the head of an array whose type does not guarantee it is non-empty. Five could move their existing emptiness check onto the destructured head: `classify` in `parse-plate.ts` (by taking a non-empty tuple), the `withRegion2` / `withoutRegion2` assembly inside `classify`, `unregisteredShapePlateTypes` in `readings.ts`, and `plateTypesOf` in `vehicle-part-templates.ts`. `mergePlateTypes` cannot: a filter result cannot express non-emptiness inherited from its input. Fixes that are not type-level are either branches real data cannot reach (D-18) or assertions. Revisit after #39, for plate-domain `tsconfig.lib.json` only, and only if every error is fixable by types. Revisited in #67: enabled for plate-domain lib (below).
- Revisited after #39 (#67): measured 10 errors in plate-domain `tsconfig.lib.json`; all fixed by types (non-empty tuples, head destructuring, `entries()`, undefined-checked index). Enabled for plate-domain lib only; specs unchanged. Other projects keep it off; the BUGBOT flag covers them. `mergePlateTypes` too: one tuple sorted in place, then deduplicated.
- Review flags index access and head destructuring whose non-emptiness is not in the type, including code that relies on `noUncheckedIndexedAccess` being off (`BUGBOT.md`). Several such sites were caught by hand in #39.
- **Rejected:** a prose-only rule (#37 shows review misses it); `warn` (does not fail `lint`); including specs (see above); `@typescript-eslint/no-unnecessary-condition` (needs typed linting, and catches only conditions the type makes dead, not data-level ones such as `Set.has` on real data).

---

## AI-assisted development

### D-19 Project context lives in the repo, not in chat history — Accepted

`AGENTS.md` (rules and current focus), `docs/backlog.md` (plan), `docs/decisions.md` (this file) and GitHub issues (task + acceptance criteria) are the source of truth for agents.
One chat per task; at the end, ask whether anything should go into `AGENTS.md`.

- **Why:** long chats degrade quality and carry stale "facts" (e.g. an agent "remembered" `--legacy-peer-deps` being used here — it never was).

### D-20 Models and modes — Accepted

Plan new tasks with the strongest model (Opus) in Plan mode; execute the approved plan with Auto in Agent mode, in the same chat. Raise reasoning effort for architecture-level planning.

### D-21 MCP servers — Accepted

- **GitHub MCP** (remote): user-level `~/.cursor/mcp.json` (holds a token — never committed), explicit toolsets `context,repos,issues,pull_requests,projects,labels`. `gh` CLI covers gaps such as milestones; both act as the user.
- **Nx MCP**: project-level `.cursor/mcp.json` (no secrets, committed), `npx nx mcp --no-minimal` so workspace tools (`nx_workspace`, generators, schemas) are exposed. Nx's official skills were reviewed and not installed — see D-25.
- Known issues with nx-mcp 0.25.0: `nx_project_details` fails on Nx 22.7+ (fixed upstream, not released — nrwl/nx-console#3186); `nx_workspace` fails on Nx 23.3.1 because `dependsOn` entries of the inferred `e2e-ci` target do not match the tool's output schema (#28; not checked on 23.2.1). The generator tools work.
- Duplicate servers with overlapping tools are disabled (they confuse tool selection).

### D-22 Agent working rules — Accepted

Recorded in `AGENTS.md`; the non-obvious ones:

- Plan first, wait for approval; never commit unless asked.
- If a tool or MCP call fails, report the exact error before any fallback.
- When Nx or Nx MCP returns stale results, run `npx nx reset` and restart the MCP server before changing configuration. (An "Nx bug" here turned out to be stale daemon state; a config change made for it was reverted.)
- Comments explain _why_, never _what_.
- A diff in a report includes new files, because `git diff` does not show untracked files. (The #36 report said new files were "in the diff above" when they were not.)
- External writes are staged in a checked file, with every step chained (`AGENTS.md`). (Editing the #37 body: a Python guard exited 1 inside `$(...)`, the steps were not chained, and `printf '%s' "$NEW_BODY" | gh issue edit 37 --body-file -` wrote an empty body; it was restored by hand. A file can be checked and diffed before the write; a failed substitution silently yields an empty string.)
- Branch from an up-to-date `origin/main` (`git fetch origin && git switch -c <branch> origin/main`) and confirm `git --no-pager log --oneline origin/main..HEAD` is empty before any edit. (“Branch first” did not say from where; a branch from a stale local `main` once carried unrelated commits.)
- Every report after running code opens with test/typecheck/lint pass/fail counts and exit codes; each failing test lists input, expected, actual, and whether the bug is in code or the expectation. Spec expectations change only with approval. (Two #39 reports omitted results; 22 tests were failing behind the first.)
- Plan mode creates no files anywhere, including `/tmp`. A fact that needs a command is given as the command and marked unverified. (In #39 Plan mode wrote under `/tmp` despite read-only.)
- Command output given as evidence is quoted in full; long output goes to a file under `tmp/`. (A #51 report shortened `awk` output over the Provision column with `…`, so the rows it cited could not be checked.)

### D-23 One review checklist — Accepted

`.cursor/BUGBOT.md` is the single source of review criteria. Cursor's Agent Review (Find Issues, `/agent-review`) reads it regardless of whether Bugbot is enabled; `/review`, `/review-bugbot` and Bugbot read it too, and it can be @-mentioned in chat. The AI PR review in CI (Epic 8) uses the same file. No duplicated criteria in workflows.

- **Why:** Agent Review reads `BUGBOT.md`, while Bugbot ignores `.cursor/rules/*.mdc` (Cursor docs).
- **Rejected:** `.cursor/rules/review.mdc` as the source (invisible to Agent Review and Bugbot); a `BUGBOT.md` that only links to `review.mdc` (following links is not documented); a `review.mdc` pointer — redundant with built-in review commands.
- **Open (Epic 8):** whether the CI AI review is a custom GitHub Actions workflow or Bugbot — decide in Epic 8.

### D-24 Agent context split: AGENTS.md vs .cursor/rules — Accepted

- `AGENTS.md` is the always-on layer: project context, goals, working rules, language, commits, how to run Nx.
- `.cursor/rules/*.mdc` hold narrow technical rules. Cursor lists them to the agent; the agent loads a rule when it works on files matching its globs (`nx` can also be requested by description). None is `alwaysApply`.
- Rules state what to do and cite decision IDs; reasoning stays in this file. Rules never restate `AGENTS.md`.

- **Why:** always-on context is paid on every request, so it holds only what applies everywhere; file-scoped rules load only where they matter; one home for reasoning keeps rules short and prevents drift.
- **Rejected:** everything in `AGENTS.md` (grows unbounded, mostly irrelevant per task); nested `AGENTS.md` per project (cannot target file types such as `*.spec.ts` or `project.json` across folders); `alwaysApply` rules (duplicate the role of `AGENTS.md`); copying reasoning into rules (drifts from this log).

### D-25 Skills hold multi-step workflows — Accepted

Project skills live in `.cursor/skills/<name>/SKILL.md`, next to `.cursor/rules/`. A skill describes a repeatable multi-step workflow — commands, file placement, checklists, verification — and cites rules and decision IDs instead of restating them. The agent picks a skill from its `description`; the first is `create-web-feature`. Nx's official skills (deferred by D-21) were reviewed as reference and not installed; the useful parts (non-interactive generation, dry run first, verify after generating) are folded into `create-web-feature`.

- **Why:** rules describe what code must look like and load by file globs; a workflow spans several files and commands and is needed before those files exist. Citing rules keeps one source per rule, as in D-24.
- **Rejected:** `.agents/skills/` (cross-tool portability is not needed — the project uses one agent tool); restating rules inside skills (drift); installing Nx's official skills (`nx configure-ai-agents` writes a managed block into `AGENTS.md`; their broad descriptions would compete with project skills for the same requests).

### D-38 Index tables and independent test oracles — Accepted

Lessons from the #38 review (PR #61) and from #39:

- Markdown tables are indexes (`markdown.mdc`). Prettier pads every cell in a column to its longest cell, so an edit that changes the longest cell re-pads the whole column and shows every row as changed. Long content in sections keyed by row ID changes one line per edit (`docs/pl-plate-rules.md`, D-33).
- Property-style tests also assert a literal result, because a check that only compares two runs passes a constant stub. That literal comes from an independent oracle (`testing.mdc`): a literal produced by the code under test, or by an oracle that calls it, repeats the implementation's mistakes. The registry is the source itself (D-26), and a constant pinned by its own literal test has already been checked against the act; the logic under test is excluded because its result is what the test checks. An oracle written from the act text or the registry file is a second derivation, and naming its source in the plan makes it checkable.
- A count obtained by running the code under test is a measurement for this log, not a literal in a test: asserting it pins the implementation the same way a SUT-derived oracle does (`testing.mdc`). Caught by hand in an enumeration test in #39.
- **Rejected:** extending D-33 (one table, while the rule covers all Markdown); literals copied from a run of the implementation (they pin current behaviour, not the source).

---

## Data

### D-26 Plate registry source and update policy — Accepted

`plate-data` is built from the full official source from the start: the table of registration codes in Annex 13 to the Rozporządzenie Ministra Infrastruktury z dnia 8 listopada 2024 r. (Dz.U. 2024 poz. 1709), as amended by Dz.U. 2025 poz. 939 (§ 1 pkt 4) and Dz.U. 2026 poz. 891 (§ 1 pkt 9), the provisions that change Annex 13. These are the only amending acts listed on ISAP, and both are in force as of 2026-10-05. No consolidated text (tekst ujednolicony) exists, so the registry is the base table with the amendments applied in order.

- No fixture or sample registry, and no invented codes anywhere — including tests and docs.
- Scope: the current Annex 13 only. Historical (withdrawn) codes are out of scope; a code not in the table is reported as "not in the current registry", never guessed.
- Names: Polish names come from the act. Voivodeship names are stored in their lowercase official form (e.g. `dolnośląskie`); the uppercase in Annex 13 is table typography. This is the only normalisation applied to source names. The 16 voivodeships additionally get English names, explicitly marked as not taken from the act.
- Update policy: before each release that touches `plate-data`, and at least quarterly, check "Akty zmieniające" for Dz.U. 2024 poz. 1709 on ISAP manually. A new amending act gets its own issue; the import (#34) is updated, then this entry and the README "Data source" section.

- **Why:** plate codes have legal force, so every code must be traceable to the act. Two amendments within two years show the table does change, so the bundled registry (D-01) needs an explicit source and update policy; with a defined scope, "not in the current registry" is an honest answer rather than a gap.
- **Rejected:** a hand-written fixture first (would bake in invented codes); unofficial lists such as Wikipedia (no authority, no revision trail); including historical codes now (no official current source for them; conflicts with "not in the current registry").

Import (#34): committed, re-runnable and deterministic — re-running on the same input gives a byte-identical file (empty `git diff`). It lives in `libs/plate-data/scripts/` as an `.mts` file run with Node 24 type stripping (D-15) and type-checked by `tsconfig.scripts.json` as part of `plate-data:typecheck` (D-13). The base table is parsed from `pdftotext -layout` output (the input is not committed); amendments are an explicit typed patch list, each patch citing its act and provision. The layout output depends on the poppler version (verified with 26.10.0); determinism holds for the same input, and a layout change makes the script throw on an unclassifiable line rather than produce different data. No tool version appears in the generated output.

### D-27 Parse result and registry access in plate-domain — Accepted

`parsePlate` (#37) returns a discriminated union on `status`, with `country: 'PL'` on every variant (D-07); `region1`/`region2` reference registry records instead of copying strings. plate-domain uses the plate-data registry directly and builds its lookup indexes once at module level; tests run against the full real registry. Partial-input candidates (#39) get a separate function and type (D-39). The type was written in #37 rather than #36 because a type written in #36 would have had variants real data cannot reach (D-18).

Variants of `ParseResult` (plate types added in #38, D-34):

- `resolved` — every reading names the same region2; carries `plateTypes`;
- `region1-only` — no reading carries a region2: reduced (§ 27 ust. 3, § 30 ust. 2 pkt 2), diplomatic (pkt 7), temporary (pkt 6) or individual (pkt 4) plates; carries `plateTypes`. Reduced formats in pkt 2 lit. d, f and g put a letter immediately after the voivodeship letter, and those are the layouts that coincide with full codes (`WA12` is mazowieckie reduced, not a powiat). A column-6 code at the start is a registry fact; the plate type comes from the matched templates (D-34);
- `ambiguous` — only after look-alike substitution (L2): one reading names a region2 and another carries none; region1 is the same in every reading. It carries `withRegion2: { region2, plateTypes }` and `withoutRegion2: { plateTypes }`. A list of region2 would describe states real data never reaches (D-18);
- `region2-not-in-registry` — valid column-4+5 shape whose distinguisher is not in the current registry (D-26); carries the `plateTypes` of the matched shape templates;
- `not-in-registry` — the first character is a letter outside Annex 13 column 4 (H and U). Final within the scope of Dz.U. 2024 poz. 1709: no format in the act starts with a letter outside column 4 (D-35); confirmed by D-46 (#60);
- `invalid-input` — `invalid-characters` (from normalisation) or `no-matching-format` (including a leading digit: no § 30 ust. 2 template starts with one);
- `empty` — empty or separator-only input.

A separate «region undeterminable (valid special plate)» variant was planned for #38 and is dropped. Every § 30 ust. 2 format starts with an Annex 13 distinguisher, so a valid plate always yields region1, and plates outside the act are out of scope (D-35). With real data the variant is unreachable (D-18). This deviates from the backlog item «an honest "region can't be determined" answer»; the honest answers are `region1-only` (the plate encodes no region2) and a `plateTypes` with more than one element (the characters do not determine the type).

- **Why:** A discriminated union lets consumers narrow exhaustively (`@switch` in the app, `switch` in TypeScript), and each honest answer is its own state instead of a combination of nullable fields. With 100% branch coverage (D-18) there are no branches real data cannot reach and no default-parameter branches.
- **Rejected:** a single result with nullable fields (invalid combinations become representable); the registry as a parameter defaulting to plate-data; an `ambiguous` with a list of region2 (unreachable under the L1/L2 invariants); a «region undeterminable» variant (unreachable, D-18). A `createParser(registry)` factory stays an additive option.

### D-31 Normalised plate input keeps group boundaries; invalid input is its own variant — Accepted

`normalisePlateInput` (#35) returns a discriminated union on `status`. `ok` holds `groups` (the parts between separators, in input order) and `compact` (the groups joined, the form used for code lookup). `invalid` holds the characters outside the § 30 ust. 1 alphabet, as typed. Empty or separator-only input is `ok` with no groups, because partial input (#39) starts empty. The parser (#37) maps `invalid` to its own invalid-input variant (D-27) and reads only `compact`: group boundaries are not used in #37.

- **Why:** a two-character code can be a prefix of a three-character code of another region2 (`DW` Wrocław, `DWW` powiat wrocławski), so normalisation must keep the boundary for later use. Region1 resolution (#36) already reads only `compact`: no Annex 13 full code is a single letter, and no column-5 suffix contains a digit. In #37, reading as typed never yields two readings with different regions, so there is nothing for a boundary to break; on L2 a typed boundary would help only some look-alike cases and can itself be wrong (`DWL 123`). Boundaries are therefore kept for partial-input candidates (#39); #39 uses them for order only (D-39). Rejecting characters outside the alphabet here means every later step sees only alphabet characters, and the UI can name the offending characters.
- **Rejected:** deleting separators and returning only the compact string (the boundary would be lost before #39); using group boundaries in #37 to break L2 ties (incomplete and can follow a mistyped separator); passing characters outside the alphabet through for the parser to reject (every later step would have to handle them, and the parser would have to rediscover which characters were wrong).

### D-32 Format-aware readings in levels — Accepted

Replaces the backlog item «powiat by longest matching prefix (3 characters, then 2)» the same way D-07 records the departure from «as JSON». `parsePlate` builds readings — a registry distinguisher (column-4 letter, column-4+5 full code from plate-data `fullCodes`, or column-6 code) plus a vehicle part that matches a § 30 ust. 2 template — and takes the first level that yields any:

1. **L1** — the input as typed;
2. **L2.1** — 0↔O and 1↔I swapped at positions 2–3, one substitution; **L2.2** — both positions, only if L2.1 is empty;
3. **L3** — as typed, a valid column-4+5 shape whose distinguisher is not in the registry (`region2-not-in-registry`), only if L2 is empty;

otherwise `invalid-input` / `no-matching-format`. A leading digit is `no-matching-format`: no § 30 ust. 2 pkt 1–7 template starts with one (digits 0 and 1 in the first position are already mapped to O and I by normalisation). Incomplete input such as `D`, `DW` or `WA1` is also `no-matching-format` by design; candidates while typing are #39 (D-39).

Vehicle-part character rules are applied in #37: letters exclude B, D, I, O and Z (§ 31 ust. 1), except on individual plates (the reservation «z zastrzeżeniem § 32 ust. 2» in § 31 ust. 1; R-36, R-39), and every digit group is non-zero (the «od 0…01» ranges in each tiret). They belong here because the parser now answers «no valid reading»; a partial rule set would change answers later when the rest landed. The templates are internal data, each with one citation, and are meant to be reused by #51.

Classification of the readings at the winning level: none carry region2 → `region1-only`; all carry region2 → `resolved`; otherwise → `ambiguous` (only observed on L2, as one region2 plus a region1-only reading).

Enumeration counts below are strings of a representative domain (digit runs filled with `2`, letter runs with `A`), not numbers of plates. The full domain is 23 column-4 letters × 35² characters on positions 2–3 × 62 fills of length 1–5 = 1 746 850 strings (L1 readings 140 359; L1 multi-region2 and L1 mixed both 0; L2 mixed after ranking 168; swapping L2 and L3 would change 7 650 strings). The readings invariant spec runs on the narrowed domain of 6 258 length-3 prefixes that can yield a full code in some look-alike variant (387 996 strings; L1 readings 43 096; mixed on L2 still 168), because the full domain took ~11 s under Vitest with coverage.

- **Why:** Format checks make motorcycle/moped and reduced plates resolve to the right distinguisher where a longest prefix would not, and levels prefer the typed input as evidence: fewer look-alike changes stay closer to what was typed (the same reason L1 precedes L2). L2 precedes L3 because a look-alike that hits the registry is stronger evidence than guessing a new code; 7 650 strings depend on that order. Ranking on L2 cuts mixed outcomes from 312 to 168 and keeps cases such as `SOI234` as Sosnowiec (one substitution) instead of ambiguous with the two-substitution temporary reading. Classification relies on the invariant enforced by the readings spec (0 multi-region2 on L1 and L2, 0 mixed on L1), which is why `resolved` may take region2 from any reading.
- **Rejected:** longest matching prefix (wrong for 212 motorcycle/moped pairs and for 119 two-character and 316 three-character full codes that a reduced plate can imitate); a candidate list without format checks (274 codes would always yield two candidates, and «no valid reading» would be unreachable); L2 without ranking by substitution count (312 mixed strings instead of 168; `SOI234` would be ambiguous).

### D-33 Plate rules source table — Accepted

`docs/pl-plate-rules.md` lists every rule plate-domain relies on, one row per rule. Each row has a stable ID (R-01 …), the provision (act + § + ust. + pkt + lit.), the verbatim Polish text in its current wording, the amending provision, and whether the rule is visible in the typed characters. Code and specs cite the row ID next to the provision (e.g. `§ 31 ust. 1 (R-36)`); vehicle-part templates carry their row IDs as data (D-34).

- IDs are never renumbered or reused. A new rule gets the next free ID. A rule removed by an amendment keeps its row, marked withdrawn, with the amending provision.
- Every new amending act (D-26 update policy) is checked against every row; changed rows quote the amending text.

- **Why:** every rule in code becomes traceable to one reviewed row of the act, and a citation can be checked against a single source.
- **Rejected:** citations only in code comments (no single place to review against the act); the table inside this file (mixes legal facts with project decisions).

### D-34 Plate types in parse results — Accepted

The plate type follows § 25 of Dz.U. 2024 poz. 1709 (R-01): `PlateType = 'ordinary' | 'individual' | 'vintage' | 'temporary' | 'diplomatic'` (zwyczajne, indywidualne, zabytkowe, tymczasowe, dyplomatyczne). It is exported from `@plate-region/plate-domain`.

- `resolved`, `region1-only` and `region2-not-in-registry` carry `plateTypes: readonly [PlateType, ...PlateType[]]`. It is the union of the plate types of every template matched at the winning level, in § 25 order, without duplicates. `ambiguous` carries `withRegion2: { region2, plateTypes }` and `withoutRegion2: { plateTypes }`. `not-in-registry`, `invalid-input` and `empty` have no type.
- More than one element means the characters alone do not determine the type; there is no separate flag. Under the current act this happens only for reduced plates (pkt 2 serves ordinary, temporary and vintage reduced plates, which differ only in colour; R-26, R-35).
- Each vehicle-part template carries `plateTypes` and `rows` (row IDs, D-33) in place of the internal `family`.
- Not exposed: plate size (car, motorcycle, moped, reduced; R-02–R-05) and the electric/hydrogen colour variant (R-07, R-09, R-11, R-13). Neither is part of the § 25 type, and car and motorcycle templates after a two-letter powiat share six layouts.
- Counts per `plateTypes` set and per `ambiguous` pair over the representative domains are asserted as literals (`readings.spec.ts`).
- Candidates (D-39) carry `plateTypes` and `completeAs` in the same § 25 order.

- **Why:** § 25 is the act's own classification; a list keeps "cannot be determined from the characters" honest without a sentinel, and the fixed § 25 order keeps results deterministic.
- **Rejected:** a single `plateType` plus an `undeterminable` flag (two fields that can contradict each other); exposing template families (size is not a type and often cannot be determined); a «region undeterminable» variant (D-27).

### D-35 Plates outside Dz.U. 2024 poz. 1709 — Accepted

The base act and its amendments neither describe military, service (police and others) or trade/test plates nor name an act that does. The three acts were searched for "Policj", "Sił Zbrojnych", "wojsk", "służb", "Straż", "Agencj", "Obrony Narodowej", "Żandarm", "Wywiad", "Kontrwywiad", "próbn", "badawcz", "specjaln", "salon" and for H and U in Annex 13 column 4; no hit regulates plates, and the only military reference is § 1 ust. 3 (art. 73 ust. 2a ustawy). These plates are out of scope; follow-up #60 tracks finding the governing acts. A leading H or U stays `not-in-registry` until #60 decides otherwise: in this act H and U are only column-5 suffixes (m.st. Warszawa, Chorzów), never Annex 13 distinguishers (R-37, R-48).

- Deviates from the backlog item «special plates — custom, service, military, diplomatic, temporary, vintage»: custom (individual), diplomatic, temporary and vintage plates are covered; service and military plates are not.

- **Why:** formats are never invented (D-26); without a source, any special-plate answer would be a guess.
- **Rejected:** a provisional special-plate variant for H and U (no source; unreachable as a distinct legal state, D-18).

Update: #60 confirmed this scope; see D-46.

### D-36 Readings of the act recorded without code changes — Accepted

- Individual plates: the digits «0» and «00» stay allowed. § 30 ust. 2 pkt 4 (R-29) lets at most the last two letters be replaced with digits but gives no range, unlike every other format (R-34).
- Vintage plates: pkt 5 opens with «następne cyfry lub cyfry i litera», but lit. b tiret 3 starts with a letter («litera i cyfra»). The specific lit. b governs, and the `LD` template stays (R-31).
- Two-row plates: the row split appears only in the Annex 12 drawings, which are images (R-42). It matters for partial and photographed input and belongs to #39. Closed by D-40: the split is the R-41 `+`, confirmed by the drawings.
- Individual plates and region1: the owner chooses only between the two letters of the same voivodeship (§ 32 ust. 2 as amended, R-39), so region1 is determined. Docs and UI say the plate carries a voivodeship code, not where the vehicle is registered.
- Temporary reduced plates use the voivodeship letter (pkt 2, R-26), not a column-6 code; region1 is the same either way.

- **Why:** each point was checked against the act in #38 and changes no answer; recording it stops it from being argued again.

### D-39 Candidates for partial input — Accepted

`candidatesFor(input)` (#39) answers which regions and plate types the typed characters can still become or already are. It is the separate function and type reserved by D-27; `ParseResult` is unchanged.

- **Statuses.** A discriminated union on `status`, with `country: 'PL'` on every variant: `candidates`, `invalid-input` (`invalid-characters` | `no-matching-format`), `not-in-registry` (H, U; D-35) and `empty`. `no-matching-format` means that no continuation of the input is a valid plate, including a leading digit.
- **Shape.** `candidates` carries one region1 — the first letter determines it (#36) — and a non-empty list of entries: one per region2 (by reference, the full codes that agree with the input, `plateTypes`, `completeAs`); at most one without region2 (a column-4 letter or column-6 code); at most one `region2-not-in-registry` entry (a valid column-4+5 shape whose code is not in the current registry, D-26; L3 of D-32). `plateTypes` lists the § 25 types still possible for the entry, in § 25 order (D-34). `completeAs` lists the types for which the input is already a complete plate; it is always present and empty while the input is not complete for that entry. Layouts and sizes are not exposed (D-34).
- **Codes.** A region2 entry's `codes` lists only the codes of the readings that give the entry its plate types: the codes behind the winning level of the completable part, plus the codes of the complete readings. Codes reached only through a losing level are not listed.
- **Complete part.** Taken from the winning-level readings that `parsePlate` classifies; both functions call the same internal level selection, so agreement holds by construction and each reading carries its code. Mapping: `resolved` → its region2 entry; `region1-only` → the entry without region2; `ambiguous` → one region2 entry and the entry without region2; `region2-not-in-registry` → the L3 entry.
- **Completable part.** The input is a proper prefix of a valid plate: a registry distinguisher (column 4, columns 4+5 via plate-data `fullCodes`, column 6) that is a prefix of the input or that the input is a prefix of, followed by a vehicle-part prefix that at least one template can still complete. The level is chosen as in D-32 and independently of the complete part: as typed, then one look-alike swap at positions 2–3, then two, then L3. `WI12` is a Warszawa prefix as typed and a complete reduced-size plate `W112` at L2.1; a shared level would lose one of them. Measured in #39: on a representative domain (positions 1–3 over the plate alphabet, fills as in the readings invariant; 2 658 250 strings, 1 008 with non-empty L2.2), 704 strings have empty L2.1 completions and non-empty L2.2, so completable L2.2 is implemented.
- **Fully typed digit groups.** R-34 applies to a digit group only once the group is fully typed: `DW0000` can still become `DW00001`, while `DWR00` excludes every layout whose first group is the two digits `00`.
- **L3 while typing** appears only when L1 and L2 give nothing to complete, so a letter right after the voivodeship letter is first read as the vehicle part of a reduced-size plate (R-26 lit. d, f, g): `DA` and `DA1` have no L3 entry; `DA12` has one, because the three-character reduced vehicle part `A12` is complete and cannot be extended.
- **Order.** Deterministic: the region2 entry with a code equal to the first typed group comes first; then Annex 13 order — the entry without region2 (the voivodeship row precedes its powiats), region2 entries in registry order, the L3 entry last (it is not in Annex 13). Group boundaries affect the order only; the set of entries never depends on separators (D-31).
- **No limit.** Every entry is returned; Epic 2 truncates. The number of region2 entries is at most the maximum, over first code characters, of region2 with a full code starting with that character, counted from plate-data codes; the spec pins it as a literal.
- **Cost of a keystroke.** The distinguisher prefix index and the template prefix patterns are built once at module level (D-27). A call does map lookups plus one length check and at most one regex test per template of each matched distinguisher, and never enumerates continuations. Tests assert results and counts, not time; enumeration tests set explicit timeouts.
- **I/O → 1/0 in the vehicle part:** D-42 (#63), applied to `parsePlate` and to the completable part together.
- **Contracts in specs (#72).** Two exhaustive specs check the JSDoc claims of `candidatesFor`. `candidates-complete-agreement.spec.ts` (C48): on the readings representative domain (387 996 strings) and every string of length 1–3 starting with a column-4 letter (23 × (1 + 35 + 35²) = 29 003), the entries with non-empty `completeAs` follow the complete-part mapping above (compared as arrays, § 25 order), and every `completeAs` is within `plateTypes`. The domain is chosen to cover every mapping branch, not as a completeness argument; `resolveCompact` is shared, so C48 cannot detect a bug in it (covered by `parse-plate.spec` and the readings invariant). `candidates-separators.spec.ts` (C49): every prefix of each full code + `12345` (5 354) and of each column-6 code + `1234` (1 380), plus their 2 882 look-alike swaps at positions 2–3, under every single boundary and, from length 3, with all characters separated; leading, trailing and doubled separators only on the 919 full-length strings, because normalisation drops empty groups regardless of position (D-31). On these 43 001 comparisons the entry set, `codes` included, does not change; order changes for 2 223 bases and is not asserted. Six one-line mutations of `candidates.ts` (complete part of the without-region2, region2 and L3 entries, `codes` order, filtering by the first group, the without-region2 `plateTypes` merge) each make these specs fail. Measured locally under coverage: C48 about 4.1 s in isolation and 4.6 s in the full run, C49 about 1 s and 1.3 s; `plate-domain` `test` wall time about 3.8 s → 6.4 s.

- **Why:** One region1 with region2 entries mirrors what the characters encode (#36, D-27), and the entry without region2 keeps plates without a powiat honest (`S0`). Sharing the level selection with `parsePlate` leaves one source of truth for complete plates. Levels for the completable part keep D-32's preference for the typed input. Ordering by the first group lets a typed boundary help without hiding anything when it is mistyped.
- **Rejected:** extending `ParseResult` (D-27); a flat region2 list (no place for plates without a powiat); one entry per full code (wrocławski would appear twice); a `complete: boolean` per entry (`S01234` is a complete temporary plate and an incomplete diplomatic one); an optional `completeAs` (an optional operand that real data cannot make undefined, D-18); deriving the complete part from the `ParseResult` alone (it carries no code); re-implementing level selection for the complete part (two sources of truth); one level for both parts (`WI12` loses one reading); group boundaries as a filter (`DWL 123` and `KRA 123` would drop the complete reading); a `limit` parameter (a default value is a default-parameter branch, D-27, and truncation is a UI decision); wall-clock assertions (the CI runner is about 2.5× slower and runs Nx tasks in parallel).

### D-40 Two-row plates: the line break is an ordinary separator — Accepted

Annex 12 Rys. 11, 13, 14, 15 and 16 of Dz.U. 2024 poz. 1709 (PDF pages 63–68) were rendered and read in #39. Row 1 always holds the distinguisher and row 2 the vehicle part, which is the `+` of the variant notation (`2L+5C`, `1L, 1C+3L`) already covered by R-41. A line break in typed or recognised text is whitespace, and therefore a group boundary like any other separator (D-31). Closes the two-row point of D-36.

- Rys. 15 (motorcycle, individual) is two-row as well: motorcycle plates are two-row by R-04.
- Rys. 18–26 were not rendered. The set of candidates does not depend on separators (D-39), so their split cannot change an answer.

- **Why:** the drawings confirm R-41 instead of adding a rule, so no row, type or code path is needed.
- **Rejected:** new rule rows for the row split (it is the R-41 `+`); a separate two-row input mode (a UI concern that would not change the set of candidates); encoding rows per template (no case it would decide).

### D-41 Public surface of the core libraries — Accepted

`libs/plate-domain/src/index.ts` and `libs/plate-data/src/index.ts` name every public symbol with `export { … } from` and `export type { … } from`. Neither file uses `export *`. JSDoc on each of those symbols states the contract — inputs, result variants, invariants — and does not describe the implementation. A legal reference is the provision plus its row ID from `docs/pl-plate-rules.md` (D-33), in the shape `§ 30 ust. 2 pkt 1 lit. a (R-24)`. The provision is taken from the Provision column of that row; where the column marks the cite as "(representative)", the citation uses the scope stated in the Rule text instead (e.g. `§ 30 ust. 2 pkt 1–3, 5–7 (R-34)`). No citation without an existing row ID.

`normalisePlateInput` is not re-exported. Both public entry points (`parsePlate`, `candidatesFor`) already normalise, and their results already carry the invalid-input variants. Re-exporting it later is additive.

`variantCountsForCode` and `variantCountsForRegion1` (D-43) return variant counts per code and per region1. They take a full code string or a `Region1` record and do not parse plate text; `variantCountsForCode` returns `undefined` for a code not in the registry. `examplePlateForCode` and `examplePlateForRegion1` (D-44) return an example plate for a full code or a region1; `examplePlateForCode` returns `undefined` when the code is not a full code in the registry.

Each library has `src/index.spec.ts`. The spec imports `./index` by a relative path and asserts that `Object.keys(api).sort()` equals a literal list of the runtime exports. That list is the public runtime contract. It is not a list measured from the module (D-38).

Purity is an `error` in each library's own `eslint.config.mjs`. The block uses `files: ['src/**/*.ts']` and ignores `src/**/*.spec.ts` and `src/**/*.test.ts`. Patterns resolve relative to the project (D-37). `no-restricted-imports` forbids Node built-ins: `paths` built from `builtinModules` (`import { builtinModules } from 'node:module'`) for bare specifiers, and `patterns` only for `node:*` — no hand-maintained list of bare names. `no-restricted-properties` forbids `Math.random`, `Date.now` and any `console` property. `no-restricted-syntax` forbids any `new Date(…)` and `Date()`. No new package.

- **Why:** Both barrels are `export *` today, so every export of the targeted file is public, including `plateData` and `normalisePlateInput`. Naming each symbol makes the barrel the API. D-33 already requires the row ID next to the provision; this JSDoc is that citation on the public symbol and stops at the contract. The provision-column rule keeps a citation checkable against one cell; the "(representative)" exception matches how R-34 is written. `normalisePlateInput` stays internal because the two entry points already expose the same invalid-input answers, so a later re-export does not change callers. The spec imports `./index` because `@nx/enforce-module-boundaries` rejects a project importing its own `@plate-region/<lib>` alias (`nx.mdc`). The expected keys are written out because a list taken from `Object.keys` would measure the barrel (D-38). The lint pattern is `src/**/*.ts`, not `libs/**`, because Nx runs ESLint from the project directory (D-37). Specs are ignored: `libs/plate-data/src/lib/pl/registry.spec.ts` calls `new Date` to check `legalStateDate`, and a bad assertion in a spec already fails the test (D-37). `libs/plate-data/scripts/` is outside `src/`, so the import script's `node:fs`, `node:path` and `node:url` imports are not under this rule. `paths` matches the whole specifier, and `builtinModules` keeps the list in step with the installed Node. The three rules ship with ESLint.
- **Rejected:** `export *`; importing `@plate-region/plate-data` or `@plate-region/plate-domain` from inside that same project; an expected list built by reading `Object.keys`; a hand-maintained list of bare Node built-ins in `patterns[].group`; a new package for these bans.

### D-42 Look-alike correction in the vehicle part — Accepted

Extends D-32 and D-39 (#63). From position 4 on, a typed I or O is also read as 1 or 0.

- **Scope.** Positions 4 and later only: every distinguisher has at most three characters, so these positions are always the vehicle part. Positions 2–3 stay with the symmetric 0↔O / 1↔I swaps of L2 (D-32).
- **Ranking.** Each D-32 level is tried as typed, then corrected: L1 → L1c → L2.1 → L2.1c → L2.2 → L2.2c → L3 → L3c. A corrected variant replaces every I with 1 and every O with 0 from position 4 on. The correction is not counted as a substitution, so L2.1c precedes L2.2.
- **No special case for individual plates.** I and O are letters there (R-36, R-39); the as-typed reading at the same level wins first, and the correction never adds an individual reading.
- **Candidates.** The completable part uses the same order. The complete part still comes from the shared level selection (D-39).
- **Contracts.** C48 is unchanged: both of its sides take the complete part from the shared level selection. C49 adds six bases with I or O after position 3 — `DW1O`, `DBA22I`, `WII2I`, `DBI22I`, `W0I2IA`, `DBB222I` — covering L1c, L2.1c, L2.2c and L3c of the completable part (34 comparisons, every single boundary and all characters separated; no edge separators, no look-alike swaps).
- **Measured in #63** with a throwaway script that rebuilt the level selection from exported functions and matched `resolveCompact` on every string. Domain: the 6 258 prefixes of the readings invariant × fills of length 1–5 over {2, A, I} containing I (1 883 658 strings). With this ranking: 534 661 outcomes change, 0 change an existing region2, 0 new ambiguous, 0 with two region2. The same run with O instead of I: 414 439, 0, 0, 0. Partial correction (some of the I/O only) adds no reading beyond as typed ∪ fully corrected. On the readings-invariant domain (387 996 strings) no outcome changes, because its fills hold no I or O.

- **Why:** On non-individual plates I and O cannot be letters in the vehicle part (R-36), so a correction after position 3 keeps the typed distinguisher, which D-32 treats as the strongest evidence; a swap at positions 2–3 changes it. The ranking adds no ambiguity and never overrides a region2.
- **Rejected:** correcting positions 2–3 as well (on the readings-invariant domain 336 outcomes change and 108 strings get two region2, e.g. `LBI22` as `LB` and `LBI`, breaking the D-32 invariant); merging the correction into each level without ranking (984 new ambiguous, e.g. `WII2I`); a separate correction level after L2 (3 444 outcomes differ from the adopted order, e.g. `DOA2I` read as an individual `D0` plate through a distinguisher swap instead of `DOA` as typed); ranking by the total number of changes (1 378 new ambiguous).

### D-43 Vehicle-part variant counts — Accepted

Variant counts (#51) are computed arithmetically from the § 30 ust. 2 templates (R-24–R-33) and feed the registry browser and the D-29 chart.

- **Unit.** A variant is a distinct pair of distinguisher and vehicle part. Identical layouts within one distinguisher count once: pkt 1 lit. b and pkt 3 lit. b share six layouts (R-25, R-28), so per-template sums would count them twice. Compact strings are not the unit: one string can read through different codes (`ambiguous`), while the "+" gap tells pairs apart on the plate (R-41, R-42).
- **Per code.** Only column-4+5 templates (ordinary car, motorcycle and moped; non-reduced vintage): group 1 for two-character codes, group 2 for three-character codes. The count depends only on the code length. The public function takes a full code string and returns `undefined` for a code not in the registry.
- **Per region1.** The sum over its codes (from `fullCodes`), plus the column-4 templates (reduced, diplomatic) for each of its column-4 letters, plus the column-6 templates (temporary, individual) for each of its column-6 codes. Both column-4 letters count: § 31 ust. 3 orders issuance and does not limit capacity. Likewise "tworzony kolejno" (pkt 1–3) and "po wyczerpaniu" (pkt 6) order issuance; every layout counts.
- **Breakdown.** By the template's `plateTypes` set: ordinary, vintage, reduced (ordinary+vintage+temporary as one bucket; the same number serves all three, R-26, R-35), diplomatic, temporary, individual. Within a distinguisher the buckets are disjoint, so they add up to the total. Not by `PlateType`: a reduced number would count in three buckets.
- **Formula.** Product over the runs of a layout: a letter run of length k gives 20^k (25 letters, § 30 ust. 1, R-23, minus B, D, I, O, Z, § 31 ust. 1, R-36); a digit run gives 10^k − 1 (every range in pkt 1, 2, 3, 5, 6 and 7 starts at 0…01, R-34). Individual layouts give 25^k and 10^k (R-39, D-36).
- **Individual counts are an upper bound.** § 32 ust. 3 (R-49) requires a word, abbreviation or expression without offensive meaning, which the characters cannot decide.
- **Per pattern** counts stay internal and are covered through the bucket counts (D-18).
- Verified in #51 by a read-only script: for every compiled group, the arithmetic count per bucket equals enumeration through `plateTypesOf` over the full 35-character alphabet; no string matched templates from two buckets. The largest region1 total is 544 691 940, a safe integer. Measured values are not spec literals (D-38).
- **Rejected:** per-template sums (double count); counting compact strings (not additive across codes); breakdown by `PlateType` (reduced counted three times); per region2 (a sum over codes; add in Epic 2 if the registry browser needs it); leaving out individual plates.

### D-44 Example plate generator — Accepted

`examplePlateForCode(code, random)` and `examplePlateForRegion1(region1, random)` return a plate `<full code> <vehicle part>` that is valid by construction (#52). `random` is an injected `() => number` returning a value in [0, 1); the core libraries may not call `Math.random` (D-41).

- Domain: the column-4+5 templates of the code's group — ordinary and vintage plates; per region1, the union of its full codes. This is the set counted by `variantCountsForCode` (D-43), and the two cannot drift: both take the letters, the split into runs and the run capacity from `vehicle-part-templates.ts`.
- Distribution: uniform over distinct plates. One call to `random`; the index `floor(r × T)` is decomposed in mixed radix over full codes, distinct layouts in source-table order, and runs. A digit run takes the values 1 … 10^k − 1 (R-34). A value outside [0, 1) throws `RangeError`.
- Round-trip is checked through the public API: `parsePlate` returns `resolved` with the code's region2. Measured before TDD (`tmp/measure-52.cjs`): every valid plate of every full code, distinct layout and first vehicle-part character resolves to its own code; no `ambiguous`.
- **Why:** examples for placeholders and the registry browser should look like real plates; weighting by capacity makes vintage plates as rare as they are, and one call keeps every expected output derivable by hand.
- **Rejected:** column-4 and column-6 plates (individual plates are only an upper bound, § 32 ust. 3, R-49, and capacity weighting would let them dominate a region1; the others parse as `region1-only`, without a code); choosing a template first, then characters (vintage would come up in 2 of 15 picks for a 2-char code); one random call per character (longer hand derivations, nothing gained); re-drawing on an ambiguous parse (none exists, and a loop makes the number of calls unbounded); a seeded PRNG in the core libraries (the app passes `Math.random`, tests a scripted source).

### D-45 Blind agent tests — Accepted

`*.blind.spec.ts` in `plate-domain` (#41) were written by an agent that saw only the public JSDoc, the plate-data registry and excerpts of Dz.U. 2024 poz. 1709 (§ 25, § 30–32, Annex 13). They are kept as written: only the import path, registry lookups that throw instead of `!` (D-37) and removed unused constants differ; two wrong tests were deleted and are listed in the PR. They do not follow `testing.mdc` and are not rewritten to it; a failing one is checked against the act before it changes. Both wrong tests traced back to JSDoc that left out D-39 rules, so a decision that decides the result belongs in the JSDoc of the export.

- **Why:** The tests record what a reader of the contract alone expects; rewriting them would erase that. JSDoc is what callers and test writers read, not `docs/decisions.md`.
- **Rejected:** an `eslint-disable` of `no-non-null-assertion` (`BUGBOT.md` flags it, D-37); keeping 16 lint warnings in `main`; deleting the blind tests after the review (they still check the contract).

### D-46 Service, military and trade plates stay out of scope — Accepted

#60 looked for the acts that govern plates outside Dz.U. 2024 poz. 1709. D-35 stays: `parsePlate` does not recognise plates of the Armed Forces, of state services, or trade/test plates; a leading `H` or `U` still returns `not-in-registry`.

Sources (checked against the official text unless noted):

| Act                                                                                                       | Legal basis     | Covers                                          | Plate format                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MON regulation of 30.08.2023, Dz.U. 2023 poz. 1776; consolidated text Dz.U. 2026 poz. 1300                | art. 76 ust. 2  | Armed Forces, foreign armed forces              | § 6 ust. 3: `U` + one letter of 23 (no O, Q, U) + 5 digits 00001–99999 (car plates); 4 digits 0001–9999 (motorcycle plates); 4 digits + `T` (tracked vehicles)                                                             |
| MSWiA regulation of 30.09.2025, Dz.U. 2025 poz. 1326 (in force 2025-10-01; repealed Dz.U. 2023 poz. 1778) | art. 76 ust. 3  | SOP, Police, ABW and AW, CBA, Border Guard, KAS | service code `HB`, `HP`, `HK`, `HA`, `HW`, `HC` + one letter of 25 (no Q) + either one letter and 001–999 or 01–99 and two letters. Checked in Dz.U. 2023 poz. 1778 § 5 ust. 2–4; Dz.U. 2025 poz. 1326 not checked locally |
| MON regulation of 31.08.2023, Dz.U. 2023 poz. 1777                                                        | art. 76 ust. 2a | SKW, SWW                                        | § 6: service code `HM` + same structure as the MSWiA row                                                                                                                                                                   |

Known limitation: some service and military vehicles are registered under ordinary voivodeship/powiat numbers (Dz.U. 2023 poz. 1776 § 6 ust. 2; Dz.U. 2023 poz. 1777 § 6 ust. 1 pkt 2; the MSWiA regulation likewise, § 5 ust. 2 pkt 2 in the repealed Dz.U. 2023 poz. 1778). Such plates parse as civilian plates; the app cannot tell them apart.

Trade and test plates (also named in #60) were not researched: their governing act was not looked up and is not cited here. They remain out of scope under D-35; how such plates parse is not determined.

- **Why:** the project identifies the region of civilian plates. Service and military plates carry no region, and the acts do not define the meaning of the letter after the service code (for the Armed Forces the military registering authority assigns the numbers, Dz.U. 2023 poz. 1776 § 6 ust. 4). The prefixes do not collide with civilian codes: `H` and `U` never appear in column 4 of Annex 13 (R-37, R-48), so `not-in-registry` remains correct.
- **Rejected:** a `service` variant of `ParseResult` naming the service from the prefix (a result without a region, outside the project's goal); full format validation of service and military plates (same reason; the MSWiA text was not checked locally).

### D-47 Code organisation and comments — Accepted

Application code is grouped by feature: a feature folder (e.g. `apps/web/src/app/theme/`) holds its components, services, `<feature>.types.ts` and `<feature>.constants.ts`. `apps/web/src/app/shared/` holds only code used by more than one feature (e.g. `storage-keys.ts` with every `localStorage` key). Domain types stay in the libraries and are imported through their public API; they are never copied into an app.

Comments explain why, not what: no comment or JSDoc restates what the code, names or types already say. A short comment is allowed for a non-obvious reason or constraint. JSDoc is written only for the public API of libraries (exports of `libs/*/src/index.ts`), as one or two lines of contract. Existing comments are cleaned up only when the surrounding code is changed.

- **Why:** a feature stays in one place and can be moved or deleted as a unit; `shared/` stays small; comments that narrate the code go stale with the first change, while reasons cannot be recovered from the code.
- **Rejected:** folders by kind of code (`shared/types/`, `shared/constants/`) — they scatter a feature across the tree, and Angular's style guide recommends organising by feature; JSDoc on application code — it duplicates the code it describes.
