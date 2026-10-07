# Add ESLint to the backend

## Context

The backend has no linter. The frontend runs ESLint in CI; the backend only runs tsc.

## Scope

- Add ESLint 9 flat config with `typescript-eslint` recommended rules, ignoring `dist/`, `dist-tests/`, `src/generated/` and `contracts/`.
- Add `npm run lint` and a CI step.
- Fix or explicitly disable (with a reason) whatever it reports; don't change behaviour.

## Out of scope

- Prettier or reformatting the codebase.

## Acceptance criteria

- `npm run lint` exits 0 locally and in CI.
- No rule is disabled globally without a comment explaining why.

## Files likely touched

eslint.config.mjs (new), package.json, .github/workflows/ci.yml, src/**

## How to test

npm run lint

## Complexity

`trivial`

## Labels

good-first-issue, infra, complexity: trivial
