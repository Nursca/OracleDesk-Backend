# SEP-53 signMessage login path

## Context

Login uses a challenge transaction because every wallet supports `signTransaction`. Wallets that support SEP-53 `signMessage` could show users a readable message instead. The frontend issue "Optional SEP-53 signMessage login" depends on this.

## Scope

- Add `POST /auth/challenge-message` returning a single-use message (same Redis store and 5-minute TTL as today), and accept `{ address, message, signature }` on `/auth/verify` (or a sibling route), verifying per SEP-53 with `Keypair.verify` on the SEP-53 message hash.
- Document in docs/api.md.

## Out of scope

- Removing the transaction challenge.

## Acceptance criteria

- Tests: valid signature succeeds; reuse, expiry, wrong signer and a message for another address all fail, mirroring tests/auth.test.ts.

## Files likely touched

src/services/auth.service.ts, src/controllers/auth.controller.ts, src/routes/auth.routes.ts, docs/api.md, tests/

## How to test

npm test

## Complexity

`medium`

## Labels

enhancement, security, complexity: medium
