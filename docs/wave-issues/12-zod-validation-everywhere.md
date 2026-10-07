# Validate every remaining request with zod

## Context

Most new endpoints validate with zod, but a few older handlers still read raw `req.query` / `req.body`: `setSpendingAllowance`, `getPositions` (`status` is passed straight to Prisma), `listTraces` pagination and `getMarketGenerationStatus`.

## Scope

- Add zod schemas for those handlers in `src/validators/`, return `400 VALIDATION_ERROR` with field errors on bad input, like `listMarkets` does.

## Out of scope

- Changing response shapes.

## Acceptance criteria

- `GET /portfolio/positions?status=NOPE` returns 400 instead of a Prisma error.
- One test per handler for a bad input.

## Files likely touched

src/controllers/*.ts, src/validators/*.ts, tests/

## How to test

npm test

## Complexity

`trivial`

## Labels

good-first-issue, api, complexity: trivial
