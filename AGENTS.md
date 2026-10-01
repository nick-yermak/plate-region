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
- Never commit or push unless asked. Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …).
- Never add `Co-authored-by` trailers or any mention of AI tools to commits or PRs.
- Domain logic in `libs/plate-domain` is written test-first (TDD) and stays framework-free.
- Do not invent plate codes or regions. The registry in `libs/plate-data` is the only source of truth; if data is missing, say so.
- Keep changes small and focused on the task at hand; mention unrelated issues instead of fixing them silently.
- Communicate with the user in Russian; code, comments, commits and docs are in English.