# PlateRegion — project backlog

This is the original plan. Task status lives on the GitHub Projects board and in issues — checkboxes here are not updated.

## Board setup

One GitHub Projects board, Kanban without sprints: each epic below is a milestone, each task is an issue. Epics run roughly in order, but tasks can be picked up in parallel once their dependencies are done.

**Columns:** Backlog → Ready → In progress → Review → Done. WIP limit for In progress is 2 tasks.

**Labels:** `angular`, `ui`, `testing`, `ai-dev`, `infra`, `domain`, `pwa`, `ocr`, `good-for-agent` (tasks that can be fully delegated to a Cursor agent).

**Custom fields:** Epic (single select), Size (S — up to 2 h, M — up to half a day, L — 1–2 days), Learning goal (text: what exactly the task is meant to practise).

**Issue template:** context, what to do, acceptance criteria, learning goal. The same format works for you and for an agent reading the issue via GitHub MCP.

**Definition of done for every task:** code merged to main via PR, tests green in CI, Cursor rules or README updated where relevant.

## Epic 0 — Foundation

Outcome: an empty but properly configured monorepo that builds, tests and deploys on push, with Cursor aware of the project rules.

- [ ] Create the GitHub repository and a GitHub Projects board as described above (columns, labels, fields, issue template)
- [ ] Connect GitHub MCP in Cursor and let the agent create the issues from this backlog — the first MCP exercise
- [ ] Generate the Nx workspace with the Angular app `web` (standalone, zoneless, Vitest, Playwright)
- [ ] Create empty `plate-domain` and `plate-data` libraries, enforce module boundaries with Nx tags
- [ ] Connect Nx MCP in Cursor and explore what it gives the agent (project graph, generators)
- [ ] Set up ESLint, Prettier, husky + lint-staged, Conventional Commits
- [ ] Write base Cursor rules (`.cursor/rules`): Angular code style (signals, standalone, OnPush, control flow), Nx structure, testing rules; plus a single review checklist (`.cursor/BUGBOT.md`) — the one source of review criteria for Cursor's Agent Review (Find Issues) and the AI PR review in CI
- [ ] Write the first project skill for Cursor: "create a feature to project standards" (component + test + story)
- [ ] GitHub Actions: lint, test, build via `nx affected`
- [ ] Connect Vercel: preview deploy for every PR, production on main
- [ ] README: project idea, stack, how to run

## Epic 1 — Core: plate registry and parsing

Outcome: a pure TypeScript library that turns a plate string into voivodeship, powiat and plate type, with 100% test coverage. Built strictly test-first, no Angular.

- [ ] Find the primary source of plate codes: Annex 13 to the Rozporządzenie Ministra Infrastruktury z dnia 8 listopada 2024 r. w sprawie rejestracji i oznaczania pojazdów, wymagań dla tablic rejestracyjnych oraz wzorów innych dokumentów związanych z rejestracją pojazdów (Dz.U. 2024 poz. 1709), as amended; record the source and revision date in the README
- [ ] Design the data model: voivodeship (letter prefix), powiat (2–3 character code), Polish names (plus conventional English names for voivodeships only, D-26), plate type. Make it country-ready without building a multi-country abstraction yet: `country: 'PL'` in registry records and parse results; Polish logic in a `pl/` folder behind each library's public API; neutral region-level names in public types (e.g. `region1`/`region2`), with Polish terms only inside the `pl/` module
- [ ] Fill `plate-data` with the full registry as JSON and write a validator test (unique codes, every powiat belongs to a voivodeship)
- [ ] TDD: input normalisation (case, spaces, dashes, look-alike characters O/0, I/1)
- [ ] TDD: voivodeship from the first letter
- [ ] TDD: powiat by longest matching prefix (3 characters, then 2)
- [ ] TDD: special plates — custom, service, military, diplomatic, temporary, vintage; an honest "region can't be determined" answer
- [ ] TDD: serial-number formats per § 30 (from the act, nothing invented — D-26) and variant counts per code and per region1
- [ ] Example plate generator: pure function with an injected random source, deterministic in tests
- [ ] TDD: partial input — return candidates while typing (for autocomplete)
- [ ] Exhaustive specs for the `candidatesFor` contracts that rest on examples and construction (D-39): `completeAs` agrees with `parsePlate`; separators change only the order of candidates
- [ ] Coverage `include` and a 100% threshold for plate-data, as in plate-domain (D-18)
- [ ] Public library API and JSDoc; Cursor rule "domain logic is pure functions only, no dependencies"
- [ ] Let an agent generate some of the tests, then review them: where did it get the domain wrong

## Epic 2 — Manual lookup UI

Outcome: the first useful version — type or photograph a plate, see the region. Responsive layout, three languages, modern Angular. After this epic the product can be shown to people. Screens and behaviour: `docs/ui-spec.md`.

- [ ] NG-ZORRO and Less: first check NG-ZORRO support for the project's Angular version and zoneless; switch the nx.json component generator style to less, convert apps/web global styles, light and dark theme with a toggle (D-28), and add a `.css` component-styles flag to `.cursor/BUGBOT.md`
- [ ] App shell and routing: top bar with a burger menu, theme toggle, language switch slot, routes for all pages with placeholders, Playwright projects for mobile emulation
- [ ] Plate component and plate input styled as a Polish plate
- [ ] i18n PL/EN/RU: compare built-in Angular i18n and Transloco on a small prototype, pick one and adopt it; check plural forms
- [ ] Search form with Signal Forms: submit on Enter or button, navigate to the result page, list candidates for incomplete input
- [ ] Result page: result card for every `ParseResult` variant, SVG car with the plate
- [ ] Photo: upload and camera, preview, passed to the result page; no recognition (Epic 4)
- [ ] Voivodeship page: powiats with codes and example plates
- [ ] SVG map of Poland: first compare powiat geometry sources (OpenStreetMap, GUGiK PRG) on licence, simplified size and offline use, and measure how registry region2 codes map onto them; then voivodeship click-through and powiat highlight
- [ ] Registry table: nz-table with filter, search and sorting by variant count; example plate in every row
- [ ] Charts: pick the library (D-29); powiat codes per voivodeship, two- vs three-character codes
- [ ] About page: project and sources, how to read a plate, tech stack
- [ ] Visual regression: baselines in the Playwright Docker image, locally and in CI
- [ ] Responsiveness: final pass at 360 px, tablet and desktop

Unit and end-to-end tests are acceptance criteria of every item above.

## Epic 3 — PWA and prerender

Outcome: the app installs on a phone, works offline, and every region page is generated ahead of time and indexable by search engines.

- [ ] Add `@angular/ssr`, prerender every `/:code` route from the registry at build time
- [ ] Hydration: enable incremental hydration and `@defer` for heavy blocks (the map)
- [ ] SEO: title and meta via `Title`/`Meta` per page, sitemap.xml, hreflang for PL/EN
- [ ] Make the code safe for server rendering: no direct `window` access outside `afterNextRender`
- [ ] Service worker: manifest, icons, caching of the app shell and the registry
- [ ] Offline mode: manual lookup works without a connection, clear offline indicator
- [ ] Install: custom "add to home screen" banner
- [ ] Updates: "new version available" prompt via `SwUpdate`
- [ ] Lighthouse in CI: thresholds for Performance, PWA, SEO, Accessibility

## Epic 4 — Photo recognition

Outcome: a photo or camera frame becomes a plate string. Try locally in the browser first; on low confidence, fall back to a cloud vision model via a serverless function.

- [ ] Build a test set: 30–50 of your own photos of Polish plates in different conditions (day, night, angle, dirt) with expected answers
- [ ] Image capture: camera via `getUserMedia` and file upload, preview, cropping
- [ ] Canvas preprocessing: greyscale, contrast, locating the plate rectangle
- [ ] Local OCR (Tesseract.js) in a Web Worker, lazy-loaded via `@defer`, alphabet restricted to plate characters
- [ ] Confidence metric: OCR confidence plus validation by the domain library (does the prefix exist)
- [ ] Serverless function on Vercel: accepts an image, calls a vision LLM, returns the plate string; API key stays server-side
- [ ] Function protection: size limit, rate limit, basic abuse protection
- [ ] Hybrid logic: local → cloud below the confidence threshold → honest message when offline
- [ ] Benchmark script over the test set: accuracy of local OCR, cloud and hybrid; tune the threshold
- [ ] Confirmation screen: the user sees the recognised plate and can correct it before lookup
- [ ] Privacy: photos are never stored, and the UI says so explicitly

## Epic 5 — Region collection

Outcome: every recognised plate adds to a personal collection of regions stored only on the device. This is the main reason to come back to the app.

- [ ] Collection storage in IndexedDB (a wrapper such as `idb`), a signals-based service on top
- [ ] "Count it" button after recognition; guard against counting the same plate twice
- [ ] Collection screen: progress by voivodeship (16) and powiat, map with filled-in regions
- [ ] Achievements: first voivodeship, all powiats of a voivodeship, "all of Poland", rare regions
- [ ] Sighting history: date and region (without storing the plate itself unless needed)
- [ ] Export and import of the collection as JSON, so it survives a phone change
- [ ] Achievement unlock animations (Angular animations or CSS)
- [ ] Unit tests for achievement logic, e2e for "recognise → count → see progress"

## Epic 6 — Quality

Outcome: e2e, accessibility and visual regression run in CI on every PR. Pick these tasks up as screens appear rather than leaving them for the end.

- [ ] Playwright: base config with two profiles — Desktop Chrome and iPhone (WebKit, since every iOS browser runs on WebKit and PWA install, offline and camera behave differently there; Firefox not needed); runs against the preview deploy
- [ ] Connect Playwright MCP in Cursor; ask the agent to walk through a scenario in the browser and write an e2e test from it
- [ ] e2e: plate → region, language switch, offline mode, photo recognition on a test image
- [ ] Visual regression: `toHaveScreenshot` for key screens in light and dark theme, baseline storage
- [ ] a11y: `@axe-core/playwright` on every page, keyboard navigation and focus checks
- [ ] Storybook for Angular: stories for UI components (plate input, result card, map)
- [ ] Storybook a11y addon and visual tests for stories
- [ ] Playwright reports as CI artifacts, linked in a PR comment

## Epic 7 — Custom MCP server

Outcome: an MCP server in `apps/mcp-server` on top of `plate-domain` and `plate-data`, used by the Cursor agent during development. Optionally published as a standalone package.

- [ ] Study the MCP specification and the official TypeScript SDK: tools, resources, prompts, stdio and HTTP transports
- [ ] Server skeleton in Nx, stdio transport, connected to Cursor via `.cursor/mcp.json`
- [ ] Tool `lookup_plate`: plate → region (reuses the domain library)
- [ ] Tool `list_regions`: filter by voivodeship, search by name
- [ ] Resource with the registry, so the agent reads real data instead of inventing codes
- [ ] Tool for the photo test set: list of cases and expected answers, so the agent writes recognition tests on real data
- [ ] Server tests: unit tests for tools and checks via MCP Inspector
- [ ] Cursor rule: "for questions about region codes, use the project MCP server"
- [ ] Optional: HTTP transport, deploy as a serverless function, publish to npm

## Epic 8 — AI agents in CI

Outcome: the end-to-end flow "issue → agent → PR → AI review → merge" works for tasks labelled `good-for-agent`. First steps can start right after Epic 0.

- [ ] AI PR review in GitHub Actions: the agent comments on PRs using the shared review checklist `.cursor/BUGBOT.md` — no duplicated review criteria in the workflow
- [ ] Cursor background agents: delegate a task from an issue, get a PR, compare with how you would have done it
- [ ] Failing-test agent: on red CI, suggests a fix as a separate commit or a comment
- [ ] Triage agent: new issues get labels, size and an epic
- [ ] Automated dependency updates (Renovate) with an agent that fixes the build after an Angular upgrade
- [ ] Security boundaries: token permissions, what the agent may merge itself and what it may only propose
- [ ] Retrospective: which tasks agents handle well and where they fail; update rules and skills accordingly

## Epic 9 — Node API

Outcome: a Node API in `apps/api` on top of `plate-domain` and `plate-data` (D-30) — a backend learning ground and an interface for clients that cannot run TypeScript. Lookup in every client stays on the device (D-01). Starts after Epic 3.

- [ ] Pick the framework (NestJS vs Fastify/Hono) and the hosting (Vercel functions vs a long-running server); record the choice in D-30
- [ ] Decide the Nx tag for `apps/api` (`type:app` or a new tag with its own decision)
- [ ] Generate `apps/api` with Nx, reusing the core libraries
- [ ] Read-only endpoints for external consumers and native clients: registry export and plate lookup
- [ ] API tests and an OpenAPI description
- [ ] Later: move the D-04 OCR function here; stateful features (accounts, sync, leaderboard) each get their own decision

## Ideas for later

Not part of the first version; file them in Backlog without priority.

- Freemium: cloud recognition paid beyond a free quota
- "On the road" mode: continuous recognition from the camera without pressing a button
- React learning app in the monorepo (imports the libraries directly)
- iOS app via React Native/Expo or Capacitor, app store release
- Plates from other countries (Germany, Czechia, Lithuania) as a registry extension
- Accounts and collection sync across devices
- Leaderboard among friends
- Historical (withdrawn) plate codes
