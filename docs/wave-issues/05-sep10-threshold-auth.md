# Accept multisig accounts in wallet login

## Context

`/auth/verify` accepts only a signature from the address's own master key (`verifyChallengeTxSigners` with `[address]`). Accounts that removed or down-weighted their master key, or use multisig, can't log in.

## Scope

- Load the account's signers and thresholds from Horizon (or RPC `getLedgerEntries`) and use `WebAuth.verifyChallengeTxThreshold` with the medium threshold, falling back to the current behaviour for accounts that don't exist on-chain.

## Out of scope

- Muxed accounts and client domain verification.

## Acceptance criteria

- Tests with a fake account reader: 2-of-3 multisig succeeds with two signatures and fails with one; master-key-only accounts behave as today.
- Existing auth tests still pass.

## Files likely touched

src/services/auth.service.ts, tests/auth.test.ts

## How to test

npm test

## Complexity

`medium`

## Labels

enhancement, security, stellar, complexity: medium
