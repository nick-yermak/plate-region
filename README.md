# PlateRegion

**Which part of Poland is that car from?** Type or snap a Polish licence plate and PlateRegion tells you the voivodeship and powiat it was registered in. Works offline, installs on your phone, and turns every plate you spot into a growing collection of regions.

> 🚧 **Status: early development.** The project is being built in public. Features below marked as _planned_ are not implemented yet — see the [project board](#roadmap) for progress.

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

PlateRegion normalises the input, matches the longest known prefix against an official registry of codes, and handles special cases (custom, military, diplomatic, temporary and vintage plates) by saying honestly when a region can't be determined.

## Tech stack

| Area         | Tools                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------- |
| Frontend     | Angular (standalone, zoneless, signals, Signal Forms, `resource`/`httpResource`)            |
| Styling      | Tailwind CSS, responsive mobile-first layout, light/dark theme                              |
| Rendering    | Prerender + hydration, PWA (service worker, offline, install)                               |
| Recognition  | Tesseract.js in a Web Worker + cloud vision model via a serverless function                 |
| Testing      | Vitest, Playwright (e2e + visual regression), axe-core (a11y), Storybook                    |
| Monorepo     | Nx                                                                                          |
| Hosting & CI | Vercel, GitHub Actions                                                                      |
| AI tooling   | Cursor rules & skills, MCP servers (GitHub, Nx, Playwright + a custom one), AI agents in CI |

## Project structure

```
apps/
  web/            Angular application
  mcp-server/     MCP server exposing the region registry to AI agents  (planned)
libs/
  plate-domain/   Pure TypeScript plate parsing logic, framework-free
  plate-data/     Registry of voivodeship and powiat codes
```

_(Structure will appear as the Nx workspace is set up.)_

## Getting started

> Setup instructions will be added once the workspace is generated.

```bash
git clone https://github.com/<your-username>/plate-region.git
cd plate-region
npm install
npx nx serve web
```

## Development

```bash
npx nx run-many -t lint test
npx nx format:check
npx nx format:write
```

Pre-commit runs Prettier and ESLint on staged files via lint-staged. Commit messages must follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …); an optional Nx project scope is allowed, e.g. `feat(plate-domain): …`.

## Roadmap

Work is tracked on the GitHub Projects board, split into epics:

0. Foundation — Nx workspace, CI, Cursor rules
1. Core — plate registry and parsing (TDD)
2. Manual lookup UI and i18n
3. PWA and prerendered region pages
4. Photo recognition (local OCR + cloud fallback)
5. Region collection and achievements
6. Quality — e2e, accessibility, visual regression
7. Custom MCP server
8. AI agents in CI

## Why this project

Besides being a tool I actually want on my phone, PlateRegion is a deliberate playground for modern Angular, testing practices and AI-assisted development. Each task on the board names the skill it's meant to practise.

## Privacy

Photos are processed only to read the plate and are never stored. Your region collection lives in your browser and is never sent anywhere.

## Data source

Plate codes are based on the official Polish regulation on vehicle registration plates. _(Exact source and revision date to be added.)_

## License

TBD
