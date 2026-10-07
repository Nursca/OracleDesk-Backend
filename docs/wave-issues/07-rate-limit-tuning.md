# Rate-limit tuning and a shared store

## Context

Rate limits are in-memory (express-rate-limit's default store): 200/15 min globally, 20/5 min on /auth, 5/hour on /markets/generate. With more than one instance each keeps its own counts, and the numbers were picked without traffic data.

## Scope

- Move the limiter store to Redis (already a dependency).
- Make each limit configurable by env with today's values as defaults; add them to .env.example.
- Return `Retry-After`.

## Out of scope

- Per-user (JWT) limits.

## Acceptance criteria

- Two app instances sharing Redis enforce one combined limit (test with two app objects).
- Defaults unchanged when no env is set.

## Files likely touched

src/middlewares/rate-limit.middleware.ts, src/config/index.ts, .env.example, tests/

## How to test

npm test

## Complexity

`medium`

## Labels

enhancement, security, complexity: medium
