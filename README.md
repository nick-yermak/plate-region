# PlateRegion

[![CI](https://github.com/nick-yermak/plate-region/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nick-yermak/plate-region/actions/workflows/ci.yml)

**Which part of Poland is that car from?** Type or snap a Polish licence plate and PlateRegion tells you which voivodeship — and, when the plate encodes one, which powiat — its registration code belongs to. Works offline, installs on your phone, and turns every plate you spot into a growing collection of regions.

> 🚧 **Status: early development.** The project is being built in public. Features below marked as _planned_ are not implemented yet — see the [project board](https://github.com/users/nick-yermak/projects/2) for progress.
>
> Live: https://plate-region.vercel.app

## Features

- **Manual lookup** — type a plate (or just its first letters) and get the voivodeship, the powiat when the plate encodes one, and the plate type — or every type the characters allow — instantly _(planned)_
- **Photo recognition** — take a picture or upload one; recognition runs locally in the browser, with a cloud vision model as a fallback for hard cases _(planned)_
- **Offline-first PWA** — the full region registry is cached on the device, so manual lookup works without a connection _(planned)_
- **Region collection** — count the plates you meet, fill in the map of Poland and unlock achievements; all data stays on your device _(planned)_
- **Polish & English** interface _(planned)_
- **Region pages** — a prerendered page for every plate code, e.g. `/wa`, `/kr` _(planned)_
- **Registry browser** — every registry code in a filterable, sortable table (voivodeship, powiat, code, kind, serial-number pattern), with charts such as plate variants per voivodeship _(planned)_

## How it works

Polish plates carry registration codes from an official registry: a voivodeship code and, on most plates, a powiat code:

| Part                    | Example      | Meaning                                                                                                                                                 |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1st letter              | **W**A 12345 | Voivodeship code (W = mazowieckie)                                                                                                                      |
| First 2 or 3 characters | **WA** 12345 | Full code of a powiat or a city with powiat rights (WA = m.st. Warszawa); per the act, the powiat distinguisher itself is the 2nd or the 2nd–3rd letter |
| Rest                    | WA **12345** | Vehicle distinguisher                                                                                                                                   |

The rules come from the Rozporządzenie Ministra Infrastruktury z dnia 8 listopada 2024 r. (Dz.U. 2024 poz. 1709, as amended); each one is listed with its provision in [docs/pl-plate-rules.md](docs/pl-plate-rules.md). The parser normalises the input and reads it against the official code registry and the formats the act sets for its five plate types: ordinary, individual (custom), vintage, temporary and diplomatic. Reduced, individual, temporary and diplomatic plates carry only a voivodeship code, so the answer stops at the voivodeship. When the characters fit more than one plate type — reduced ordinary, temporary and vintage plates differ only in colour — every possible type is listed. Military, service and trade plates are not covered by this act and are not recognised. The lookup UI is _(planned)_.

The public API is `@plate-region/plate-domain` (`parsePlate`, `candidatesFor`) and `@plate-region/plate-data` (`registry`, `fullCodes`). `parsePlate` returns one of `resolved`, `region1-only`, `ambiguous`, `region2-not-in-registry`, `not-in-registry`, `invalid-input` or `empty`. `candidatesFor` (partial input while typing) returns one of `candidates`, `invalid-input`, `not-in-registry` or `empty`.

## Tech stack

Versions for Angular, Nx and other packages are in [`package.json`](package.json). Node is pinned to 24 (see Getting started).

| Area         | Tools                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Frontend     | Angular (standalone, zoneless); signals, Signal Forms, `resource`/`httpResource` _(planned)_                   |
| Styling      | NG-ZORRO with a Less theme, responsive mobile-first layout, light/dark theme _(planned)_                       |
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
  api/            Node API reusing the core libraries  (planned)
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
9. Node API

## Project docs

- [AGENTS.md](AGENTS.md) — working rules for agents and contributors
- [docs/decisions.md](docs/decisions.md) — architecture and workflow decisions
- [docs/backlog.md](docs/backlog.md) — original epic plan

## Why this project

Besides being a tool I actually want on my phone, PlateRegion is a deliberate playground for modern Angular, testing practices and AI-assisted development. Each task on the board names the skill it's meant to practise.

## Privacy

Photos are processed only to read the plate and are never stored. Your region collection lives in your browser and is never sent anywhere.

## Data source

Plate codes come from Annex 13 (the table of registration codes) to the Rozporządzenie Ministra Infrastruktury z dnia 8 listopada 2024 r. (Dz.U. 2024 poz. 1709), as amended by Dz.U. 2025 poz. 939 (§ 1 pkt 4) and Dz.U. 2026 poz. 891 (§ 1 pkt 9) — legal state as of 2026-10-05. Source scope and update policy: [D-26](docs/decisions.md).

## License

[MIT](LICENSE)
