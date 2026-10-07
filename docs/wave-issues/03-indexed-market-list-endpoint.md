# Indexed on-chain market list endpoint

## Context

The frontend reads every market's state with one RPC call per market. The indexer stores `MarketCreated`, `Trade` and `MarketResolved` events in `chain_events`, which is enough to serve a list without touching RPC.

## Scope

- Add `GET /markets/on-chain` returning the latest known state per on-chain market (reserves and price from the last `Trade`, status from `MarketResolved`), joined to backend metadata when linked, with the ledger the data is current to.
- Document it in docs/api.md (amounts as `Raw` strings).

## Out of scope

- Replacing the live `GET /markets/on-chain/:id/state` read (keep it for detail pages).
- Backfilling events older than RPC retention.

## Acceptance criteria

- Unit tests with the event fixtures in tests/fixtures/events.json.
- `priceYesBps` matches `priceYesBps(reserve_yes, reserve_no)` from the generated FPMM math.
- Response documented in docs/api.md in the same PR.

## Files likely touched

src/controllers/market.controller.ts, src/routes/market.routes.ts, docs/api.md, tests/

## How to test

npm test

## Complexity

`medium`

## Labels

enhancement, api, complexity: medium
