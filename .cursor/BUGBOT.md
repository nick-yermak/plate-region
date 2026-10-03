# Review criteria for this repository

Scope: changed lines only. Do not flag formatting, import order or naming — Prettier and ESLint own those. Do not edit files during a review. Reference `.cursor/rules/angular.mdc`, `nx.mdc` and `testing.mdc` instead of restating them.

## Correctness

- Logic matches the stated intent; edge cases and error paths are handled.
- No invented plate codes or regions — `libs/plate-data` is the only source of truth.
- No silent fallbacks after a failed tool or MCP call.

## Angular idioms

- See `.cursor/rules/angular.mdc` and D-10 / D-11.
- Flag: `@Input`/`@Output`, constructor DI, old control flow, explicit `Eager`/`Default`, `zone.js` / `NgZone` / `provideZonelessChangeDetection()`, Reactive or template-driven forms, `window`/`document` outside `afterNextRender`, SCSS or `tailwind.config.js`.

## Module boundaries

- See `.cursor/rules/nx.mdc` and D-06.
- Flag: wrong dependency direction, `@angular/*` in `type:domain`/`type:data`, deep imports past `src/index.ts`, loosened boundary lint or `eslint-disable` for boundaries.

## Tests

- See `.cursor/rules/testing.mdc` and D-12 / D-13 / D-14.
- Flag: new behaviour without a test; weakened assertions; `fakeAsync`/`tick`; CSS selectors or `waitForTimeout` in e2e; missing `typecheck` after library/spec changes.

## Accessibility

- Interactive elements have roles and accessible names.
- Keyboard support and focus order are preserved for UI changes.

## Security / secrets

- No committed tokens, API keys or `~/.cursor/mcp.json` (D-21).
- Vision API keys stay server-side (D-04). Photos are never stored.

## Comments

- Comments explain why, not what — see `AGENTS.md`. No "added" / "updated" / "fixed" notes in code.

## Commits and PRs

- Squash merge only (D-16): the PR title must be a Conventional Commit with an optional Nx project scope.
- No AI tool mentions and no `Co-authored-by` trailers.

## Severities

- `blocking` — must fix before merge.
- `non-blocking` — should fix.
- `nit` — subtype of non-blocking; trivial; CI may drop these without losing real findings.

## Finding format (chat and CI reviews)

Bugbot uses its own comment format. For chat and CI reviews, one finding per line:

```text
- [blocking] apps/web/src/app/app.ts:12 — Angular idioms — <problem>. Fix: <smallest fix>.
- [non-blocking] libs/plate-domain/src/index.ts:4 — Tests — <problem>. Fix: <smallest fix>.
- [non-blocking, nit] apps/web/src/app/app.ts:20 — Comments — <problem>. Fix: <smallest fix>.
```

If there are no findings: `No findings.`
