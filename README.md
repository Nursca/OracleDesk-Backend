# OracleDesk Backend

OracleDesk is an AI prediction-market terminal. Agents propose markets and trade them on Stellar, and every decision ships with a reasoning trace whose hash is recorded on-chain so anyone can check it. This repo is the API, the Stellar event indexer and the LLM pipeline. It handles wallet login and subscriptions, and creates markets and agent trades through the treasury contract (dry-run by default).

> **Testnet only, unaudited.** See [docs/STATUS.md](docs/STATUS.md) for what is verified.

## How the three repos fit

| Repo | Role |
|---|---|
| [OracleDesk-SmartContract](https://github.com/OracleDesk/OracleDesk-SmartContract) | Soroban contracts, generated TypeScript bindings, testnet deployment, the x402 trace service. **Source of truth.** Pinned here as the `contracts` submodule. |
| **OracleDesk-Backend** (this repo) | API ([docs/api.md](docs/api.md)), indexer, agents. |
| [OracleDesk-Frontend](https://github.com/OracleDesk/OracleDesk-Frontend) | Next.js web app. Reads contracts directly, signs with the user's wallet. |

```mermaid
flowchart LR
  fe[Frontend] -->|REST + socket.io| api[Express API]
  subgraph Backend
    api --> db[(Postgres)]
    api --> redis[(Redis<br/>login challenges)]
    idx[Indexer<br/>getEvents poller] --> db
    idx -->|TRADE_EXECUTED<br/>REASONING_PUBLISHED| api
    agents[Market-maker + trader agents<br/>LLM pipeline] --> db
    agents --> chain[chain.service<br/>dry-run by default]
  end
  agents --> ipfs[(IPFS / Pinata)]
  chain -->|treasury.agent_create_market<br/>agent_buy / agent_sell<br/>reasoning_registry.publish_trace| rpc[(Stellar RPC testnet)]
  idx --> rpc
  api -->|verify payments,<br/>read market/resolver state| rpc
```

More detail in [docs/architecture.md](docs/architecture.md).

## Prerequisites

- Node.js 22 LTS (`.nvmrc`). Built and tested here with Node 24.13.1 and npm 11.8.0; CI uses Node 22.
- PostgreSQL 16 and Redis 7 (Docker is easiest; see below).
- Optional: LLM keys (Anthropic or Gemini) for market generation, Pinata credentials for IPFS pinning, and NewsAPI or FRED credentials for news and macro signals. The server boots without them.
- Optional: the [Stellar CLI](https://developers.stellar.org/docs/tools/cli) 27+ to cross-check contract state.

## Quick start

```bash
git clone --recurse-submodules https://github.com/OracleDesk/OracleDesk-Backend.git
cd OracleDesk-Backend && nvm use && npm ci
git submodule update --init && npm run sync:contracts   # no-op unless the submodule moved
docker run -d --name oracledesk-pg -e POSTGRES_USER=oracledesk -e POSTGRES_PASSWORD=oracledesk -e POSTGRES_DB=oracledesk -p 127.0.0.1:5433:5432 postgres:16-alpine
docker run -d --name oracledesk-redis -p 127.0.0.1:6379:6379 redis:7-alpine
cp .env.example .env    # set DATABASE_URL=postgresql://oracledesk:oracledesk@127.0.0.1:5433/oracledesk
npx prisma migrate dev
npm run dev             # http://localhost:8000
scripts/smoke.sh        # in another terminal
```

With an empty `JWT_SECRET` / `AUTH_SIGNING_SECRET` the server generates throwaway ones per process and warns; set real ones for anything shared.

## Configuration

Every variable is listed and explained in [.env.example](.env.example) and validated at startup by `src/config/index.ts`; a bad or missing value stops the server with the variable's name.

Key switches:

- `CHAIN_EXECUTION_MODE=dry-run` (default): every contract write is built and simulated, logged, and never signed. `live` signs with `AGENT_SECRET_KEY` and is refused on any network but testnet.
- `PAYMENTS_RECIPIENT`: where daily-pass payments must go. Defaults to the treasury contract; see [docs/STATUS.md](docs/STATUS.md) before relying on that.
- `ADMIN_ADDRESSES`: G-addresses allowed to trigger market generation.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with reload |
| `npm run build` / `npm start` | Compile to `dist/` / build and run |
| `npm test` | Compile and run `tests/*.test.ts` with `node:test` |
| `npm run sync:contracts` | Copy generated contract code from `contracts/` into `src/generated/` |
| `npm run check:contracts` | Fail if `src/generated/` is stale (CI runs this) |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `scripts/smoke.sh` | Smoke test a running server (health, login, markets, live chain read) |

## Project structure

```
src/
  agents/        Market-maker and trader cycles
  config/        Env validation (zod) and contract ids
  controllers/   HTTP handlers          routes/   Express routers
  services/      chain (Stellar writes/reads), indexer, auth, payments,
                 IPFS, trace publishing, market creation, LLM-backed logic
  services/stellar/  Binding clients and contract error names
  lib/           Prisma, Redis, logger, categories, amounts, resolution specs
  generated/     Copied from the contracts submodule. Do not edit.
prisma/          Schema and forward-only migrations
tests/           node:test suites and fixtures
scripts/         sync-contracts.mjs, smoke.sh
contracts/       OracleDesk-SmartContract submodule (pinned)
docs/            API contract, architecture, porting notes, status, backlog
```

## Deployed testnet contracts

From `src/generated/deployments.testnet.json` (contracts commit `eb5f3fd`):

| Contract | Id |
|---|---|
| market-core | `CC4MMHWZ6ZRYAOQRR42KIIWNEZNFM4CWQ5Y4NNWTWNRUYH2O7E3SRK2O` |
| treasury | `CBTFA3EPQ63PL5XXHOMU4LRDCAB2MHKOLEPDQI7E7TNK454YNBOMZLYB` |
| resolver | `CDDJU3PH6T3Z4O6EYLALXXB5XBFPYO2G5P5RBDEIZ7ZVN6V37OQSVYGR` |
| reasoning-registry | `CAFEED35XICK4OXIEXQDS6KTTBUA2LDNW3EXEUGTNMN54DY5ANETCH6M` |
| USDC (self-issued test asset, SAC) | `CA2WQQJ4OHQCLHQW6XN4BCLILGRV6V4YDYDT3GVIWXB53BTOO7EMREQH` |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), including how to pick up a Drips Wave issue. Security reports: [SECURITY.md](SECURITY.md). License: [MIT](LICENSE).
