# AGENTS.md — PlateRegion

Context and working rules for AI agents (Cursor and others) in this repository.

## Project

PlateRegion identifies the Polish region (voivodeship and powiat) a vehicle was registered in, from a licence plate that is typed in or photographed.

Goals, in order of how decisions should be weighed:

1. A tool the author actually uses, with potential to become a product.
2. A learning playground for modern Angular, layout/styling, testing and AI-assisted development. Prefer the modern, idiomatic approach over the quickest hack — learning the right way is part of the point.

## Current focus

**Epic 2 — Manual lookup UI** (Angular app on NG-ZORRO and Less: shell, plate components, search, result and reference pages).
Full backlog: `docs/backlog.md`. Do not start work from later epics unless asked.
Architecture and workflow decisions with their reasons: `docs/decisions.md`. Read it before proposing changes to architecture, tooling or workflow; if a change contradicts a decision, say so explicitly.

## Stack

- Nx monorepo
- Angular: standalone components, zoneless change detection, signals, Signal Forms, `resource`/`httpResource`, new control flow
- NG-ZORRO (ng-zorro-antd) with Less, responsive mobile-first, light/dark theme
- Charts: library per D-29
- Prerender + hydration, PWA (service worker, offline, install)
- i18n: Polish and English
- Photo recognition: Tesseract.js in a Web Worker, cloud vision model fallback via a serverless function
- Testing: Vitest (unit), Playwright (e2e, visual regression), axe-core (a11y), Storybook
- Hosting: Vercel; CI: GitHub Actions
- Node API: planned (D-30)

## Planned structure

```
apps/web            Angular application
apps/mcp-server     Custom MCP server over the plate registry (later)
apps/api            Node API over the core libraries (planned)
libs/plate-domain   Pure TypeScript plate parsing — no Angular, no side effects
libs/plate-data     Registry of voivodeship and powiat codes
```

## Working rules

- Do nothing without an explicit request. For anything larger than a small edit, propose a plan first and wait for approval.
- Plan mode creates no files anywhere, including `/tmp`. A fact that needs a command is given as the command and marked unverified.
- On the GitHub Projects board, only epics that have started have issues; later epics stay in `docs/backlog.md` (D-16). Do not create issues for them unless asked.
- File-scoped technical rules live in `.cursor/rules/` and load by file globs; review criteria live in `.cursor/BUGBOT.md`. Do not restate them here. Multi-step workflows live in `.cursor/skills/` (D-25).
- In rule frontmatter, a `globs` value must not start with `*` (YAML alias token — the rule silently fails to load). Start with a literal path segment, e.g. `apps/**/*.spec.ts`, not `**/*.spec.ts`.
- Never commit or push unless asked. Branch from an up-to-date `origin/main` (`git fetch origin && git switch -c <branch> origin/main`) and confirm `git --no-pager log --oneline origin/main..HEAD` is empty before any edit. Squash merge — the PR title is the commit message, so it must be a Conventional Commit (`feat:`, `fix:`, `docs:`, `chore:` …; optional Nx project scope). Never `--no-verify`.
- Never add `Co-authored-by` trailers or any mention of AI tools to commits or PRs.
- npm only; Node version from `.nvmrc`; `engines.node` in `package.json` stays on the same major (D-15). Never `--legacy-peer-deps` or `npm audit fix --force` — fix the cause. New install scripts need approval in `allowScripts`. Never delete or regenerate `package-lock.json` without approval; on ERESOLVE, stop and report the exact error.
- Domain logic in `libs/plate-domain` is written test-first (TDD) and stays framework-free.
- Do not invent plate codes or regions. The registry in `libs/plate-data` is the only source of truth; if data is missing, say so.
- Legal rules cite row IDs from `docs/pl-plate-rules.md` (D-33); a new rule gets a row there before code cites it.
- Keep changes small and focused on the task at hand; mention unrelated issues instead of fixing them silently.
- Communicate with the user in Russian; code, comments, commits and docs are in English.
- Comments explain _why_ — intent, constraints, non-obvious decisions — never _what_ the code already says. No comments that restate code, and no change notes like "added", "updated" or "fixed" inside code. JSDoc only on the public API of libraries (exports of `libs/*/src/index.ts`), as one or two lines of contract (D-47).
- Organise application code by feature: `<feature>/` holds its components, services, `<feature>.types.ts` and `<feature>.constants.ts`; `app/shared/` only for code used by more than one feature (D-47).
- Each component lives in its own folder inside its feature: `<feature>/<component-file-name>/` holds its `.ts`, `.html`, `.less` and `.spec.ts`; services, functions, types, constants, pipes and `i18n/` stay at the feature root (D-47 Update #107). The root component `app.ts` stays in `app/`.
- Components are presentational by default (`input`/`output`/`computed`, no feature-service `inject`); only route pages, feature roots and the layout are containers that inject services and wire their children. One concern per service (D-48).
- Class member order: `inject()` dependencies, `input`/`output`/`model`, public → protected → private state, constructor, public → protected → private methods; template-only members are `protected` (D-48).
- Import order and class member order are enforced by ESLint (perfectionist, D-49): run `eslint --fix` instead of reordering by hand. "Template-only members are protected" (D-48) is not lintable — check it in review. Keep one blank line between a file header comment and the first import: a comment directly above an import moves with it.
- If a tool or MCP call fails, report the exact error before using a fallback; never silently switch approaches.
- Every report after running code starts with test/typecheck/lint results: pass/fail counts and exit codes. Each failing test is listed with input, expected and actual, and classified as a code bug or a wrong expectation. Spec expectations change only with approval.
- e2e: every Playwright test carries at least one viewport tag (`@desktop`, `@tablet`, `@mobile`): projects select tests by tag (D-50), so an untagged test runs in no project. `--list --grep-invert '@desktop|@tablet|@mobile'` must find no tests.
- Icons: register icons where they are rendered — `provideNzIconsPatch([...])` in the providers of that component or lazy route; no global icon list in `app.config.ts`; specs do not list icons of child components (D-28).
- Layout: use NG-ZORRO layout primitives (`nz-flex`, `nz-space`, `nz-row`/`nz-col`) and `var(--pr-*)` tokens; own CSS only for what they cannot express (hide-only media queries, sizing), with no hard-coded spacing values; no utility-class frameworks (D-28, D-50).
- Translations: add keys to `<feature>/i18n/en.json` and `pl.json` (one top-level key, equal to the folder name); `web:i18n` merges them and `build`, `serve` and `test` depend on it — restart `serve` after editing a dictionary. Switch the language only through `LanguageService`.
- Nx `inputs` and `outputs`: list file globs explicitly — brace patterns such as `{en,pl}` are not expanded, so a changed file would not invalidate the cache.
- A presentational component that hosts containers (theme switcher, language switch) receives them through content projection (`<ng-content />`), not by importing them (D-48).
- One responsibility per component: a component renders one piece of UI or wires one feature. If describing it needs "and" (it shows a value and also edits it; it renders a control and also lays out the page around it), split it into sibling components, or into a container and presentational children. Signs to split: inputs or outputs that serve unrelated concerns, independent blocks in one template, a spec that needs unrelated setups for different tests (D-48).
- Command output quoted as evidence (`grep`, `awk`, `sed`, test or coverage summaries, and similar) is quoted in full, exactly as printed — never shortened with `…`, elided rows or a summary. If it is too long for the report, write it to `tmp/<branch>-<name>.txt` together with the exact command that produced it, and give that path instead.
- The Cursor sandbox blocks some IPC and network calls and remaps home paths: Nx fails with unix-socket `EPERM`, `gh` fails with `graphql: Forbidden`, Playwright reports its browser as not installed. Report the exact error, then rerun the same command outside the sandbox; never run `playwright install` (or any other install) to work around it.
- Writes to external systems (`gh issue|pr create|edit|comment`, GitHub MCP writes, and similar) go through a checked file (D-22): for an edit, first fetch the current content to a file; write the new content to a file; check it with `test -s`; show it and its diff against the current content; wait for the user's confirmation; then write with `--body-file <file>` (or the MCP equivalent after the same show-and-confirm step). Chain every `gh` step with `&&` or run under `set -euo pipefail`; never pass content through a shell variable or `$(...)`.
- When a report shows a diff, include new files: `git add -N <file>` before `git diff`, or `git diff --no-index /dev/null <file>` (D-22). Write the diff to `tmp/<branch>-step-<N>.diff` and give that path in the report instead of referring to chat output.
- At the end of a task, ask whether anything should go into `AGENTS.md`.

## Nx

- Prefer `npx nx` for workspace tasks (`run`, `run-many`, `affected`, `g`) over calling the underlying tools directly.
- Use the Nx MCP tools for the project graph, project details and generators when they help.
- Never guess CLI flags — check `nx_docs` or `npx nx <command> --help` first.
- For plugin-specific guidance, look for `node_modules/@nx/<plugin>/PLUGIN.md` when it exists.
- If Nx or the Nx MCP server returns stale or inconsistent results, run `npx nx reset` and restart the MCP server before changing any configuration.
- A `DB transaction error` from Nx that mentions `FOREIGN KEY` is stale workspace state, not a code or configuration problem: run `npx nx reset`, then rerun the same command unchanged. If the Nx terminal UI hides the cause of a failure, rerun with `--outputStyle=static`.
- To run one spec file, pass `--coverage.enabled=false` and the file pattern after `--`: `npx nx test <project> -- --coverage.enabled=false <file-pattern>`. Without the flag, the global coverage threshold fails the run with exit code 1 even when every test passes; coverage is only meaningful for the full project run.
- With nx-mcp 0.25.0, `nx_project_details` fails on Nx 22.7+ (fixed upstream but not yet released: https://github.com/nrwl/nx-console/issues/3186), and `nx_workspace` fails on Nx 23.3.1 with an output-schema error on the `dependsOn` of the inferred `e2e-ci` target. Use `npx nx show projects` and `npx nx show project <name>` instead; the generator tools (`nx_generators`, `nx_generator_schema`) work. Remove this note once a fixed nx-mcp is published and both tools pass.
- GitHub MCP write operations (e.g. updating an issue) return an interactive confirmation form that Cursor does not render, so the operation never completes. Use `gh` for GitHub write operations instead; reading via GitHub MCP works.
- Bulk GitHub Projects operations (`gh project item-edit`, `item-add`) use the GraphQL rate limit (5000 points/hour) and can exhaust it. Before a bulk change, check `gh api rate_limit`; batch fields per item and verify with one query at the end instead of re-reading after every edit.
