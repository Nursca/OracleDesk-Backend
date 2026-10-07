# Backfill onChainMarketId for existing markets

## Context

The Stellar migration added `markets.onChainMarketId`, but rows created before it (or created while `CHAIN_EXECUTION_MODE=dry-run`) have none, and on-chain markets created outside the backend (e.g. by the contracts repo's `scripts/demo.sh`) have no backend row. The frontend lists those separately as "without OracleDesk metadata".

## Scope

- Add `npm run backfill:markets` (a script under `scripts/` using the existing services) that walks `market_count()` / `get_market(id)` and links each on-chain market to a backend row by `questionHash` (sha256 of the pinned question JSON) or `metaUri`.
- Report unmatched markets on both sides; never guess a match.
- Idempotent: running it twice changes nothing the second time.

## Out of scope

- Creating backend rows for unmatched on-chain markets (report them instead).
- Changing how new markets are created.

## Acceptance criteria

- A unit test with a fake chain reader covers: match by questionHash, match by metaUri, no match, already linked.
- The script never writes anything on-chain (read-only clients only).
- Output lists matched, unmatched-chain and unmatched-db ids.

## Files likely touched

scripts/backfill-markets.ts (new), src/services/chain.service.ts (reads only), package.json, tests/

## How to test

npm test; run against a local DB seeded with one linkable market.

## Complexity

`medium`

## Labels

enhancement, stellar, complexity: medium
