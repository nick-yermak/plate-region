# PlateRegion — project backlog

Oct 1, 2026 · @Nick Yermak

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
- [ ] Write base Cursor rules (`.cursor/rules`): Angular code style (signals, standalone, OnPush, control flow), Nx structure, testing rules
- [ ] Write the first project skill for Cursor: "create a feature to project standards" (component + test + story)
- [ ] GitHub Actions: lint, test, build via `nx affected`
- [ ] Connect Vercel: preview deploy for every PR, production on main
- [ ] README: project idea, stack, how to run

## Epic 1 — Core: plate registry and parsing

Outcome: a pure TypeScript library that turns a plate string into voivodeship, powiat and plate type, with 100% test coverage. Built strictly test-first, no Angular.

- [ ] Find the primary source of plate codes: the annex to the Minister of Infrastructure regulation on registration plates; record the source and revision date in the README
- [ ] Design the data model: voivodeship (letter prefix), powiat (2–3 character code), PL/EN names, plate type. Make it country-ready without building a multi-country abstraction yet: `country: 'PL'` in registry records and parse results; Polish logic in a `pl/` folder behind each library's public API; neutral region-level names in public types (e.g. `region1`/`region2`), with Polish terms only inside the `pl/` module
- [ ] Fill `plate-data` with the full registry as JSON and write a validator test (unique codes, every powiat belongs to a voivodeship)
- [ ] TDD: input normalisation (case, spaces, dashes, look-alike characters O/0, I/1)
- [ ] TDD: voivodeship from the first letter
- [ ] TDD: powiat by longest matching prefix (3 characters, then 2)
- [ ] TDD: special plates — custom, service, military, diplomatic, temporary, vintage; an honest "region can't be determined" answer
- [ ] TDD: partial input — return candidates while typing (for autocomplete)
- [ ] Public library API and JSDoc; Cursor rule "domain logic is pure functions only, no dependencies"
- [ ] Let an agent generate some of the tests, then review them: where did it get the domain wrong

## Epic 2 — Manual lookup UI

Outcome: the first useful version — type a plate, see the region. Responsive layout, two languages, modern Angular. After this epic the product can be shown to people.

- [ ] Add Tailwind, define design tokens (colours, typography, spacing), light and dark theme
- [ ] Build the input styled as a Polish plate (blue PL strip, monospace font)
- [ ] Input form with Signal Forms: format validation, error hints
- [ ] State with signals and `computed`: the result recalculates on every keystroke
- [ ] Result card: voivodeship, powiat, plate type, clear message for special plates
- [ ] Autocomplete candidates for partial input
- [ ] SVG map of Poland highlighting the voivodeship (and the powiat, if a lightweight geometry source exists)
- [ ] Routing: home, region page `/:code`, about
- [ ] i18n PL/EN: compare built-in Angular i18n and Transloco on a small prototype, pick one and adopt it
- [ ] Responsiveness: check at 360 px, tablet and desktop
- [ ] Make sure zoneless works without hacks: no `NgZone`, no dependencies that require zone.js
- [ ] Component unit tests with Vitest

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

- [ ] Playwright: base config, mobile and desktop profiles, runs against the preview deploy
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

- [ ] AI PR review in GitHub Actions: the agent comments on PRs using the project's Cursor rules
- [ ] Cursor background agents: delegate a task from an issue, get a PR, compare with how you would have done it
- [ ] Failing-test agent: on red CI, suggests a fix as a separate commit or a comment
- [ ] Triage agent: new issues get labels, size and an epic
- [ ] Automated dependency updates (Renovate) with an agent that fixes the build after an Angular upgrade
- [ ] Security boundaries: token permissions, what the agent may merge itself and what it may only propose
- [ ] Retrospective: which tasks agents handle well and where they fail; update rules and skills accordingly

## Ideas for later

Not part of the first version; file them in Backlog without priority.

- Freemium: cloud recognition paid beyond a free quota
- "On the road" mode: continuous recognition from the camera without pressing a button
- Native build with Capacitor and app store release
- Plates from other countries (Germany, Czechia, Lithuania) as a registry extension
- Accounts and collection sync across devices
- Leaderboard among friends
