# Porting inventory: Arc (EVM) → Stellar (Soroban)

Every file that touched EVM, Arc, Polygon, Circle, Polymarket or CCTP when the
port started, and what happens to it. Built from

```bash
grep -rliE "wagmi|viem|ethers|circle|polymarket|cctp|\barc\b|0x[0-9a-fA-F]{40}|polygon" src tests prisma package.json .env.example README.md
```

and then by reading each file. The Soroban contracts in
`OracleDesk-SmartContract/oracledesk-stellar` are the source of truth.

## Delete

| File | Why |
|---|---|
| `src/config/contracts.ts` (current content) | Arc addresses and viem `parseAbi` ABIs. Rewritten from scratch (see below). |
| `src/services/circle.service.ts` | Circle Developer-Controlled Wallets: contract execution on Arc, webhook signature checks, transaction lookup for payment verification. |
| `src/controllers/webhook.controller.ts` + its two routes in `src/app.ts` | Circle webhook receiver. |
| `src/services/polymarket.service.ts` | Polymarket CLOB order signing with `ethers`. |
| ~~`src/services/hedging.service.ts`~~ | **Kept** after reading it: it is pure database/risk logic (stop-loss, drawdown, hedge suggestions) with no chain or Polymarket calls. Its `autoHedge` only writes PENDING trade rows, which nothing executes; recorded as a backlog item. |
| `tests/payment-chain-oracle.test.ts` | Tests Circle webhooks, mock EVM hashes, the dev-mode payment bypass and the open resolve endpoint, all of which are removed. Replaced by Stellar tests. |

## Rewrite

| File | What changes |
|---|---|
| `package.json` | Drop `viem`, `ethers`, `xss-clean`. Add `@stellar/stellar-sdk` (`^16`, the bindings' major). Add `sync:contracts`, `check:contracts`. |
| `.env.example` | Arc/Circle/Polymarket variables → Stellar RPC, passphrase, contract-id overrides, `PAYMENTS_RECIPIENT`, `AGENT_SECRET_KEY`, `CHAIN_EXECUTION_MODE=dry-run\|live`. |
| `src/config/index.ts` | zod schema for the new variables; fail fast with the variable name. |
| `src/config/contracts.ts` | Contract ids from the synced `src/generated/deployments.testnet.json`, with env overrides. |
| `src/services/chain.service.ts` | Circle/viem writes on Arc → Stellar writes through the treasury (`agent_create_market`, `agent_buy`, `agent_sell`) and `reasoning_registry.publish_trace`; reads via generated binding clients. Dry-run by default. |
| `src/services/indexer.service.ts` | viem `eth_getLogs` poller → Stellar RPC `getEvents` poller with a ledger cursor in Postgres and idempotent, event-id-keyed inserts. |
| `src/services/subscription.service.ts` | Circle transaction lookup + dev-mode bypass → on-chain verification of a SEP-41 `transfer` via Stellar RPC `getTransaction`. |
| `src/services/oracle.service.ts`, `src/controllers/oracle.controller.ts`, `src/routes/oracle.routes.ts` | `POST /oracle/resolve` let any logged-in user resolve any market. Removed; resolution status is read from `resolver.state` and `market_core.get_market`. |
| `src/services/trade.service.ts` | Arc buy / CCTP bridge / Polymarket fallback → `treasury.agent_buy` with an on-chain quote and slippage bound. |
| `src/services/ipfs.service.ts`, `src/utils/hash.util.ts` | Hash the exact bytes uploaded (the old `sha256Json` used a top-level key whitelist as the `JSON.stringify` replacer, which silently dropped nested keys, and Pinata re-serialised the object). |
| `src/services/market.service.ts`, `src/agents/market-maker.agent.ts` | Commit a resolution spec at creation (ADR 0001): build the spec, hash it like `scripts/spec-hash`, store it, pass the hash to `agent_create_market`. Fake `0x…` address generation removed. |
| `src/agents/trader.agent.ts` | Remove Polymarket builder code. |
| `src/controllers/trade.controller.ts`, `src/validators/trade.validator.ts` | Remove `connectWallet` (moved to an auth controller with a signed challenge) and the 42-char EVM wallet validation. Copy-trade payload carries the Soroban market id instead of an EVM address and token. |
| `src/routes/index.ts`, `src/routes/trade.routes.ts` | `/auth/connect` → `/auth/challenge` + `/auth/verify`. Remove the commented-out duplicate route. |
| `src/types/index.ts` | Drop Polymarket fields from `TradePayload`. |
| `prisma/schema.prisma` | `Market.onChainAddress` → `onChainMarketId BigInt? @unique` + `creationTxHash`; resolution spec columns; indexer cursor and event tables; `EURC` dropped. New forward-only migration. |
| `tests/helpers/env.ts` | Arc/Circle env → Stellar env. |
| `README.md` | Rewritten for Stellar. |

## Keep

LLM pipeline (`src/lib/llm.ts`, `src/lib/gemini.ts`), ingestion
(`src/services/ingestion.service.ts`), correlation and portfolio maths,
reasoning-trace generation (except hashing), cron wiring, response/error
utilities, Prisma client setup.

Existing migrations under `prisma/migrations/` are history and are not
edited. The one in `20260520010000_subscription_payments_and_allowances`
mentions Circle in a column default and stays as it is.

## Repo plumbing

| Item | Decision |
|---|---|
| `dist/`, `backend.log`, `.DS_Store` | Removed from the index and ignored. |
| `.env.example` Circle lines | The commented `CIRCLE_API_KEY`/`CIRCLE_ENTITY_SECRET` values are removed. They remain in git history and must be rotated. |
| Unpushed commit `207464d` (platform stats endpoint) | Found only in the frontend's old submodule checkout. Preserved as branch `rescued/platform-stats-207464d`; the endpoint is re-implemented on this branch without its padded numbers. |
