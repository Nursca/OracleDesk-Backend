# Record real testnet events as indexer fixtures

## Context

tests/fixtures/events.json is encoded from the contract specs because the demo's events had aged out of RPC retention (about 7 days on testnet) when the indexer was written. Real recorded events would also catch differences between the spec and what the host actually emits.

## Scope

- Once a maintainer creates fresh activity on testnet (seed a market, trade, publish a trace; see the contracts repo's scripts), capture the raw `getEvents` responses with a small script and save them as `tests/fixtures/events.recorded.json`.
- Run the indexer tests against both fixture files.

## Out of scope

- Sending testnet transactions yourself with keys you don't control.

## Acceptance criteria

- Indexer tests pass against the recorded fixtures.
- The recording script is committed and documented (it uses only public RPC reads).

## Files likely touched

scripts/record-events.ts (new), tests/fixtures/, tests/indexer.test.ts

## How to test

npm test

## Complexity

`trivial`

## Labels

good-first-issue, stellar, complexity: trivial
