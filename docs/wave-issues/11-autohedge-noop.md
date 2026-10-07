# autoHedge creates trades that never execute

## Context

`hedging.service.ts#autoHedge` writes a PENDING `Trade` row and an agent log, but nothing executes it, so "Auto-hedge executed" in the logs is misleading and the PENDING rows pile up.

## Scope

- Either execute the hedge through `executeTrade` (so it goes through `treasury.agent_buy` and respects dry-run), or stop creating the row and log the recommendation as a suggestion only. Pick one in the issue thread before coding.
- Fix the log message to match what actually happens.

## Out of scope

- Changing hedge detection logic.

## Acceptance criteria

- A test shows the chosen behaviour (an executed or simulated buy, or no Trade row).
- No PENDING trade rows are left behind by hedging.

## Files likely touched

src/services/hedging.service.ts, src/agents/trader.agent.ts, tests/

## How to test

npm test

## Complexity

`medium`

## Labels

bug, agents, complexity: medium
