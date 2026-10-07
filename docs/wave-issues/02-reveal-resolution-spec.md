# Reveal resolution specs to the resolver

## Context

Markets commit to a resolution spec at creation (ADR 0001); the backend stores the full spec (`markets.resolutionSpec`). Nothing reveals it to `resolver.register_signer_spec` / `register_price_spec`, and until that happens the market can't resolve through the normal path. Revealing is permissionless: the contract checks the hash, not the caller.

## Scope

- Add a cron step (or `npm run reveal:specs`) that finds on-chain markets whose resolver state is `Unconfigured` and whose stored spec hashes to the stored `resolutionHash`, and calls the matching `register_*_spec` through `chain.service.ts` (so dry-run applies).
- Re-hash the stored spec with `lib/resolution-spec.ts` before sending, and skip (with an error log) on mismatch.

## Out of scope

- Attesting outcomes or finalizing.
- Price-mode spec generation (signer mode is what the generator produces today).

## Acceptance criteria

- In dry-run, the step simulates `register_signer_spec` and logs the result without signing.
- Unit test with a fake chain: Unconfigured + matching spec → register; Finalized → skip; hash mismatch → skip and log.

## Files likely touched

src/services/chain.service.ts (new write wrapper), src/cron/*, src/services/market-chain.service.ts, tests/

## How to test

npm test; dry-run against testnet for a market a maintainer seeds without revealing.

## Complexity

`medium`

## Labels

enhancement, stellar, complexity: medium
