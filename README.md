# PlateRegion

[![CI](https://github.com/nick-yermak/plate-region/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nick-yermak/plate-region/actions/workflows/ci.yml)

**Which part of Poland is that car from?** Type or snap a Polish licence plate and PlateRegion tells you the voivodeship and powiat it was registered in. Works offline, installs on your phone, and turns every plate you spot into a growing collection of regions.

> 🚧 **Status: early development.** The project is being built in public. Features below marked as _planned_ are not implemented yet — see the [project board](https://github.com/users/nick-yermak/projects/2) for progress.
>
> Live: https://plate-region.vercel.app

## Features

- **Manual lookup** — type a plate (or just its first letters) and get the voivodeship, powiat and plate type instantly _(planned)_
- **Photo recognition** — take a picture or upload one; recognition runs locally in the browser, with a cloud vision model as a fallback for hard cases _(planned)_
- **Offline-first PWA** — the full region registry is cached on the device, so manual lookup works without a connection _(planned)_
- **Region collection** — count the plates you meet, fill in the map of Poland and unlock achievements; all data stays on your device _(planned)_
- **Polish & English** interface _(planned)_
- **Region pages** — a prerendered page for every plate code, e.g. `/wa`, `/kr` _(planned)_

## How it works

Polish plates encode where the vehicle was registered:

| Part        | Example        | Meaning                                           |
| ----------- | -------------- | ------------------------------------------------- |
| 1st letter  | **W** WA 12345 | Voivodeship (W = mazowieckie)                     |
| 2–3 letters | **WA** 12345   | Powiat or city with powiat rights (WA = Warszawa) |
| Rest        | WA **12345**   | Individual vehicle identifier                     |

PlateRegion will normalise the input, match the longest known prefix against an official registry of codes, and handle special cases (custom, military, diplomatic, temporary and vintage plates) by saying honestly when a region can't be determined. _(planned)_

## Tech stack

Versions for Angular, Nx and other packages are in [`package.json`](package.json). Node is pinned to 24 (see Getting started).

| Area         | Tools                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Frontend     | Angular (standalone, zoneless); signals, Signal Forms, `resource`/`httpResource` _(planned)_                   |
| Styling      | Tailwind CSS, responsive mobile-first layout, light/dark theme _(planned)_                                     |
| Rendering    | Prerender + hydration, PWA (service worker, offline, install) _(planned)_                                      |
| Recognition  | Tesseract.js in a Web Worker + cloud vision model via a serverless function _(planned)_                        |
| Testing      | Vitest, Playwright (e2e, Chromium); visual regression, axe-core (a11y), Storybook _(planned)_                  |
| Monorepo     | Nx                                                                                                             |
| Hosting & CI | Vercel (preview deploy per PR, production on `main`), GitHub Actions                                           |
| AI tooling   | Cursor rules & skills; MCP servers: GitHub, Nx; Playwright MCP, custom MCP server, AI agents in CI _(planned)_ |

## Project structure

```
apps/
  web/            Angular application
  web-e2e/        Playwright end-to-end tests for web
  mcp-server/     MCP server exposing the region registry to AI agents  (planned)
libs/
  plate-domain/   Pure TypeScript plate parsing, framework-free  (src/lib/pl/)
  plate-data/     Registry of voivodeship and powiat codes       (src/lib/pl/)
```

Dependency direction: `web` / `web-e2e` → `plate-domain` → `plate-data`. Enforced by Nx tags — see [D-06](docs/decisions.md).

## Getting started

Requires [Node 24](.nvmrc). `.npmrc` has `engine-strict=true`, so `npm ci` fails with `EBADENGINE` on a different Node major.

```bash
git clone https://github.com/nick-yermak/plate-region.git
cd plate-region
fnm use   # or: nvm use — reads .nvmrc (Node 24)
npm ci
npx nx serve web
```

The app is served at http://localhost:4200.

## Development

```bash
npx nx run-many -t lint test typecheck build
npx playwright install chromium   # once; on Linux use: npx playwright install --with-deps chromium
npx nx e2e web-e2e
npx nx format:check --all
npx nx format:write
```

Libraries have a `typecheck` target because Vitest does not type-check, and the libraries have no `build` (see [D-13](docs/decisions.md)).

Pre-commit runs Prettier and ESLint on staged files via lint-staged. Commit messages must follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …); an optional Nx project scope is allowed, e.g. `feat(plate-domain): …`. Pull requests are squash-merged and the PR title becomes the commit message, so PR titles must also be Conventional Commits (see [D-16](docs/decisions.md)).

## Roadmap

Work is tracked on the [GitHub Projects board](https://github.com/users/nick-yermak/projects/2), split into epics:

0. Foundation — Nx workspace, CI, Cursor rules
1. Core — plate registry and parsing (TDD)
2. Manual lookup UI and i18n
3. PWA and prerendered region pages
4. Photo recognition (local OCR + cloud fallback)
5. Region collection and achievements
6. Quality — e2e, accessibility, visual regression
7. Custom MCP server
8. AI agents in CI

## Project docs

- [AGENTS.md](AGENTS.md) — working rules for agents and contributors
- [docs/decisions.md](docs/decisions.md) — architecture and workflow decisions
- [docs/backlog.md](docs/backlog.md) — original epic plan

## Why this project

Besides being a tool I actually want on my phone, PlateRegion is a deliberate playground for modern Angular, testing practices and AI-assisted development. Each task on the board names the skill it's meant to practise.

## Privacy

Photos are processed only to read the plate and are never stored. Your region collection lives in your browser and is never sent anywhere.

## Data source

Plate codes are based on the official Polish regulation on vehicle registration plates. _(Exact source and revision date to be added.)_

## License

[MIT](LICENSE)
