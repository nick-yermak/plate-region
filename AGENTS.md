# AGENTS.md — PlateRegion

Context and working rules for AI agents (Cursor and others) in this repository.

## Project

PlateRegion identifies the Polish region (voivodeship and powiat) a vehicle was registered in, from a licence plate that is typed in or photographed.

Goals, in order of how decisions should be weighed:

1. A tool the author actually uses, with potential to become a product.
2. A learning playground for modern Angular, layout/styling, testing and AI-assisted development. Prefer the modern, idiomatic approach over the quickest hack — learning the right way is part of the point.

## Current focus

**Epic 0 — Foundation** (Nx workspace, linting, Cursor rules, CI, deployment).
Full backlog: `docs/backlog.md`. Do not start work from later epics unless asked.
Architecture and workflow decisions with their reasons: `docs/decisions.md`. Read it before proposing changes to architecture, tooling or workflow; if a change contradicts a decision, say so explicitly.

## Stack

- Nx monorepo
- Angular: standalone components, zoneless change detection, signals, Signal Forms, `resource`/`httpResource`, new control flow
- Tailwind CSS, responsive mobile-first, light/dark theme
- Prerender + hydration, PWA (service worker, offline, install)
- i18n: Polish and English
- Photo recognition: Tesseract.js in a Web Worker, cloud vision model fallback via a serverless function
- Testing: Vitest (unit), Playwright (e2e, visual regression), axe-core (a11y), Storybook
- Hosting: Vercel; CI: GitHub Actions

## Planned structure

```
apps/web            Angular application
apps/mcp-server     Custom MCP server over the plate registry (later)
libs/plate-domain   Pure TypeScript plate parsing — no Angular, no side effects
libs/plate-data     Registry of voivodeship and powiat codes
```

## Working rules

- Do nothing without an explicit request. For anything larger than a small edit, propose a plan first and wait for approval.
- File-scoped technical rules live in `.cursor/rules/` and load by file globs; review criteria live in `.cursor/BUGBOT.md`. Do not restate them here.
- In rule frontmatter, a `globs` value must not start with `*` (YAML alias token — the rule silently fails to load). Start with a literal path segment, e.g. `apps/**/*.spec.ts`, not `**/*.spec.ts`.
- Never commit or push unless asked. Branch first, then commit. Squash merge — the PR title is the commit message, so it must be a Conventional Commit (`feat:`, `fix:`, `docs:`, `chore:` …; optional Nx project scope). Never `--no-verify`.
- Never add `Co-authored-by` trailers or any mention of AI tools to commits or PRs.
- npm only; Node version from `.nvmrc`. Never `--legacy-peer-deps` or `npm audit fix --force` — fix the cause. New install scripts need approval in `allowScripts`.
- Domain logic in `libs/plate-domain` is written test-first (TDD) and stays framework-free.
- Do not invent plate codes or regions. The registry in `libs/plate-data` is the only source of truth; if data is missing, say so.
- Keep changes small and focused on the task at hand; mention unrelated issues instead of fixing them silently.
- Communicate with the user in Russian; code, comments, commits and docs are in English.
- Comments explain _why_ — intent, constraints, non-obvious decisions — never _what_ the code already says. No comments that restate code, and no change notes like "added", "updated" or "fixed" inside code.
- If a tool or MCP call fails, report the exact error before using a fallback; never silently switch approaches.
- At the end of a task, ask whether anything should go into `AGENTS.md`.

## Nx

- Prefer `npx nx` for workspace tasks (`run`, `run-many`, `affected`, `g`) over calling the underlying tools directly.
- Use the Nx MCP tools for the project graph, project details and generators when they help.
- Never guess CLI flags — check `nx_docs` or `npx nx <command> --help` first.
- For plugin-specific guidance, look for `node_modules/@nx/<plugin>/PLUGIN.md` when it exists.
- If Nx or the Nx MCP server returns stale or inconsistent results, run `npx nx reset` and restart the MCP server before changing any configuration.
- `nx_project_details` fails with nx-mcp 0.25.0 on Nx 22.7+ (fixed upstream but not yet released: https://github.com/nrwl/nx-console/issues/3186). Use `nx_workspace` or `npx nx show project <name>` instead; remove this note once a fixed nx-mcp is published.
- GitHub MCP write operations (e.g. updating an issue) return an interactive confirmation form that Cursor does not render, so the operation never completes. Use `gh` for GitHub write operations instead; reading via GitHub MCP works.
