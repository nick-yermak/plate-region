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

- **Why:** preview deploys per PR, serverless functions for D-04, static hosting for prerendered pages.
- **Rejected:** Netlify (initially chosen, switched by preference; technically equivalent for this project).

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

### D-07 Country-ready data model, no multi-country abstraction yet — Planned (Epic 1)

- `country: 'PL'` in registry records and parse results.
- Polish logic lives in a `pl/` folder behind each library's public API.
- Public types use neutral region levels (e.g. `region1`/`region2`); voivodeship/powiat terms stay inside `pl/`.

- **Why:** adding Germany, Czechia etc. later becomes additive, and stored collections need no data migration.
- **Rejected:** a generic "country parser" interface now — with one country we can't know the right abstraction (German plates are ambiguous without separators, Czech encode the region in the second position, Lithuanian don't encode it at all).

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
- **Node 24** via fnm, pinned in `.nvmrc` — one source for developers, agents and CI.
- **npm**, with install scripts explicitly approved (allowlist in `package.json`).
- **Never** `--legacy-peer-deps` or `npm audit fix --force`: they hide or force past real incompatibilities. Fix the cause instead (e.g. a clean reinstall for a corrupted lockfile).
- **ESLint 10** with inferred lint targets (`@nx/eslint/plugin`); Prettier for formatting.

### D-16 Git and GitHub workflow — Accepted

- Kanban in **GitHub Projects** (vs Trello or Linear): issues, PRs and the board live next to the code and are reachable by agents via GitHub MCP.
- All changes go through PRs; **squash merge only**, with the PR title as the commit message — so PR titles must be Conventional Commits.
- `main` is protected by a ruleset: PR required (0 approvals — solo developer), required checks `checks`, `e2e`, `pr-title`, no force pushes or deletion. Head branches are deleted automatically.
- Commits use the GitHub noreply email. No AI attribution in history: the `commit-msg` hook strips `cursoragent@cursor.com` trailers.
- Branch first, then commit.

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
- **Nx MCP**: project-level `.cursor/mcp.json` (no secrets, committed), `npx nx mcp --no-minimal` so workspace tools (`nx_workspace`, generators, schemas) are exposed. Nx's official skills are deferred to issue #8 as reference material.
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
