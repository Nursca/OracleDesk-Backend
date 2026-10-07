# Generate an OpenAPI document from zod schemas

## Context

docs/api.md is hand-written. Several handlers validate with zod already; others still read `req.body` directly. An OpenAPI document generated from the same schemas would keep the docs honest and let the frontend generate types.

## Scope

- Give every route a zod schema for params, query, body and response, and generate `docs/openapi.json` with a zod-to-OpenAPI library.
- Add `npm run check:openapi` (fails if the generated file is stale) to CI.

## Out of scope

- Replacing docs/api.md (keep it as the narrative).
- Frontend type generation.

## Acceptance criteria

- Every route in src/routes appears in openapi.json with request and response schemas.
- CI fails when a schema changes without regenerating.

## Files likely touched

src/validators/*, src/routes/*, scripts/, package.json, .github/workflows/ci.yml

## How to test

npm run check:openapi

## Complexity

`high`

## Labels

enhancement, api, infra, complexity: high
