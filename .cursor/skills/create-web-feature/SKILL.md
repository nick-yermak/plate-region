---
name: create-web-feature
description: >-
  Creates a new Angular component or feature in apps/web to project standards:
  runs the Nx component generator into apps/web/src/app/<feature>/, checks the
  output against the Angular rules, replaces the placeholder spec with a
  behavioural Vitest spec, and verifies with lint, test and build. Use when the
  user asks to add, create, scaffold or generate a component, page, view or
  feature in the web app (apps/web).
---

# Create a feature in apps/web

Scope: one standalone component and its unit test in `apps/web`. Not for libraries or `plate-domain` logic — see `.cursor/rules/nx.mdc` and `AGENTS.md`. Do not add routes or wire the component into other components unless the user asked.

Rules to apply (read them; do not restate them):

- `.cursor/rules/angular.mdc` — D-10, D-11
- `.cursor/rules/testing.mdc` — D-12
- `.cursor/rules/nx.mdc` — D-06
- `.cursor/BUGBOT.md` — Angular idioms, Tests, Accessibility

## Workflow

```
- [ ] 1. Inputs
- [ ] 2. Generator options
- [ ] 3. Dry run
- [ ] 4. Generate
- [ ] 5. Conformance check
- [ ] 6. Spec
- [ ] 7. Verify
- [ ] 8. Summary
```

**1. Inputs.** Confirm the feature folder (kebab-case), the component name, and what the component shows and does — the spec tests that behaviour. If behaviour is unclear, ask instead of inventing it. Location: `apps/web/src/app/<feature>/`. No new projects, libraries or tags (D-06). Plate codes and regions come only from `@plate-region/plate-data`.

**2. Generator options.** Read the `@nx/angular:component` schema via `nx_generator_schema` (or `npx nx g @nx/angular:component --help`) and use only flags listed there. `path` is the full component path from the workspace root, e.g. `apps/web/src/app/<feature>/<name>`; its last segment becomes the file and symbol name. Do not pass options that override file naming, standalone or change detection — the generator defaults decide.

**3. Dry run.**

```bash
npx nx g @nx/angular:component <path> --dry-run --no-interactive
```

Created component files must land in `apps/web/src/app/<feature>/`. A generator-default write to `nx.json` is expected — report it. Any other change outside the feature folder → stop and ask. Note the defaults it applied (file names, symbol, selector) for the summary.

**4. Generate.** Same command without `--dry-run`.

**5. Conformance check.** Read every generated file and fix deviations from `angular.mdc` — e.g. an explicit `changeDetection`, `standalone: true`, and anything else `angular.mdc` forbids.

**6. Spec.** Replace a generated test that only asserts the instance exists. Write one test per behaviour from step 1, following `testing.mdc`: render, set inputs and assert through the DOM. Interactive elements need roles and accessible names.

**7. Verify.**

```bash
npx nx format:write --files=<comma-separated created files>
npx nx run-many -t lint test build -p web
npx nx format:check --all
```

On failure, report the exact error and fix the cause; never loosen lint rules or add `eslint-disable`.

**8. Summary.** Report: the dry-run file list; created and modified files; generator defaults observed; deviations fixed in step 5; each command with its result. Do not commit.
