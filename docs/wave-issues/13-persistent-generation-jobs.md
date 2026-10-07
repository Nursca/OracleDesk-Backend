# Persist market-generation jobs

## Context

Generation jobs are tracked in an in-memory `Map` in market.controller.ts, pruned after an hour, and lost on restart (the status endpoint then answers UNKNOWN). The schema already has a `MarketGenerationJob` table that nothing uses.

## Scope

- Store job status in `market_generation_jobs` instead of the Map; keep the same API responses.

## Out of scope

- A real job queue (BullMQ is a dependency, but that's a bigger change).

## Acceptance criteria

- After restarting the server, `GET /markets/generation-status/:jobId` returns the stored status.
- Test with Prisma stubbed.

## Files likely touched

src/controllers/market.controller.ts, tests/

## How to test

npm test

## Complexity

`trivial`

## Labels

good-first-issue, api, complexity: trivial
