# Decision log

Why PlateRegion is built the way it is. Each entry records the decision, the reasoning and the alternatives that were rejected, so they don't get re-litigated or silently undone.

Statuses: **Accepted** — in effect; **Planned** — agreed, not implemented yet; **Open** — to be decided at the noted point.

When a decision changes, update its entry and status instead of deleting it.

---

## Product and architecture

### D-01 No backend; lookup runs on the device — Accepted

The plate registry is small and almost never changes, so the whole lookup (parsing + registry) is bundled into the app and runs in the browser, including offline.
The only server-side code is a single serverless function for the cloud OCR fallback (D-04), needed solely to keep the vision API key secret.

- **Why:** instant results, offline support for the PWA, nothing to operate, near-zero hosting cost.
- **Rejected:** a lookup API (adds latency, breaks offline mode, needs hosting); NestJS or BaaS (no data to store server-side).

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

- **Why:** reused by three consumers — the Angular app, the serverless function (D-04) and the custom MCP server (Epic 7); fast TDD without TestBed; unaffected by Angular upgrades.
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
- Full codes are derived (each region1 letter + each suffix), not stored, so the data mirrors columns 4 and 5 one-to-one and cannot drift. The derivation is one small pure function in plate-data (a registry fact, not parsing), shared by the validator and the plate-domain index, added with #33. Codes are unique on full codes, not on suffixes (`PL` is in two voivodeships); the validator (#33) checks it. **Rejected:** stored full codes (duplicate columns 4 × 5 and can drift).
- Provenance is registry-level only: `legalStateDate` (ISO `YYYY-MM-DD`, a plain `string`; the validator (#33) checks format and date validity) and ordered `sources` of `{ act, provision }` — order matters because amendments apply in sequence (D-26). Values come from the import (#34). Per-change traceability lives in the import's patch list and git history. **Rejected:** per-code provenance (duplicates the patch list in every record).
- Stable region2 identifier: the primary full code (primary region1 letter + first suffix in Annex 13 order), derived, not stored. Used by collection storage (Epic 5) and `/:code` routes (Epic 3). **Assumption:** amendments only append letters and suffixes, and merged or split powiats keep their codes (§ 31 ust. 4–5), so the primary code never changes — codes are therefore not 1:1 with administrative units. An amendment that removes or reorders a primary code reopens this decision.
- Not in the registry: the 25-letter alphabet (§ 30 ust. 1) and the five plate types (§ 25) are parsing concepts in plate-domain (#35, #38). The amendments restrict nothing by plate type, so records have no plate-type field.

### D-08 Region collection stored only on the device — Planned (Epic 5)

IndexedDB, no accounts; export/import as JSON to survive a phone change.

- **Why:** privacy, no backend (D-01).
- **Rejected:** accounts and sync (kept as a later idea).

### D-09 Polish and English UI — Accepted; i18n library Open (Epic 2)

Built-in Angular i18n (per-locale builds, fits prerender) vs Transloco (runtime switching) — decide after a small prototype in Epic 2.

---

## Frontend

### D-10 Modern Angular defaults — Accepted

Standalone components, signals, Signal Forms, `resource`/`httpResource`, new control flow, OnPush (the default in Angular 22 — never opt into `Eager`).
Zoneless is the default in this Angular version: there is no `zone.js` and no `provideZonelessChangeDetection()` — do not add either.

### D-11 Tailwind with plain CSS — Accepted

Tailwind is configured through CSS; no SCSS. Mobile-first responsive layout, light/dark theme via design tokens.

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
- Upgrading an exact-pinned peer group (the Angular family; expected likewise for `@nx/*` during `nx migrate`) with an existing lockfile fails with `ERESOLVE` in npm 11, even when all packages are named in one install; regenerating `package-lock.json` is then allowed with explicit approval, and the PR lists the notable version changes.
- **ESLint 10** with inferred lint targets (`@nx/eslint/plugin`); Prettier for formatting.

### D-16 Git and GitHub workflow — Accepted

- Kanban in **GitHub Projects** (vs Trello or Linear): issues, PRs and the board live next to the code and are reachable by agents via GitHub MCP.
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
- `plate-domain` enforces 100% lines and branches in its own `vitest.config.mts` (`coverage.enabled`, `coverage.include: ['src/**/*.ts']`, `thresholds`); without `include`, Vitest 4 counts only files loaded by tests. **Why:** one place, so `test` behaves the same locally and in CI and `ci.yml` stays unchanged. **Rejected:** `nx affected -t test --coverage` (the flag also reaches `web`). The atomized `test-ci--*` targets run one spec file each, so they fail the threshold once plate-domain has more than one source file; use `test`.

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
- Known issue: `nx_project_details` fails with nx-mcp 0.25.0 on Nx 22.7+ (fixed upstream, not released — nrwl/nx-console#3186).
- Duplicate servers with overlapping tools are disabled (they confuse tool selection).

### D-22 Agent working rules — Accepted

Recorded in `AGENTS.md`; the non-obvious ones:

- Plan first, wait for approval; never commit unless asked.
- If a tool or MCP call fails, report the exact error before any fallback.
- When Nx or Nx MCP returns stale results, run `npx nx reset` and restart the MCP server before changing configuration. (An "Nx bug" here turned out to be stale daemon state; a config change made for it was reverted.)
- Comments explain _why_, never _what_.

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

Import (#34): committed, re-runnable and deterministic — re-running on the same input gives a byte-identical file (empty `git diff`). It lives in `libs/plate-data/scripts/`. The base table is parsed from `pdftotext -layout` output (the input is not committed); amendments are an explicit typed patch list, each patch citing its act and provision. How the script is type-checked is decided in #34.

### D-27 Parse result and registry access in plate-domain — Accepted (design)

The type is written test-first in #36.

- The parse result is a discriminated union on `status`, with `country: 'PL'` on every variant (D-07); `region1`/`region2` reference registry records instead of copying strings.
- Variants: region1 and region2 resolved; region1 only (reduced single-row plates carry no powiat code, § 27 ust. 3 and § 30 ust. 2 pkt 2; column-6 codes); region undeterminable (valid special plate); ambiguous (several interpretations); not in the current registry (D-26); invalid input.
- Partial-input candidates (#39) get a separate function and type.
- plate-domain uses the plate-data registry directly and builds its lookup index once at module level; tests run against the full real registry.

- **Why:** A discriminated union lets consumers narrow exhaustively (`@switch` in the app, `switch` in TypeScript), and each honest answer — region1 only, undeterminable, ambiguous, not in the current registry — is its own state instead of a combination of nullable fields. With 100% branch coverage (D-18) there are no branches real data cannot reach and no default-parameter branches.
- **Rejected:** a single result with nullable fields (invalid combinations become representable); the registry as a parameter defaulting to plate-data. A `createParser(registry)` factory stays an additive option.
