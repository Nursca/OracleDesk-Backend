# Per-market socket.io rooms and replay

## Context

The indexer emits `TRADE_EXECUTED` and `REASONING_PUBLISHED` to every connected client. A market page only cares about one market, and a client that connects late sees nothing until the next event.

## Scope

- Let clients `subscribe` to `market:<onChainMarketId>` rooms and emit trade events to the room as well as globally.
- On subscribe, replay the last 20 stored events for that market from `chain_events`.

## Out of scope

- Authentication on sockets.
- Frontend changes (separate issue once this lands).

## Acceptance criteria

- A test with socket.io-client against the app: subscribe, receive replay, receive a new event from a stubbed indexer emit.
- Payload shapes unchanged from docs/api.md.

## Files likely touched

src/server.ts, src/services/indexer.service.ts, docs/api.md, tests/

## How to test

npm test

## Complexity

`medium`

## Labels

enhancement, api, complexity: medium
