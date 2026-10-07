# Honour question/category/expiry in market generation

## Context

`POST /markets/generate` accepts `{ question, category, expiry }` (validated) but `runMarketMakerCycle()` ignores them and picks a topic from live signals. The admin page says so. Admins expect their inputs to be used.

## Scope

- Pass the optional parameters into the cycle. If a question is given, skip LLM topic selection but still run validation, deduplication, spec commitment and trace generation.
- Category and expiry, when given, override the generator's choices.

## Out of scope

- Letting non-admins generate markets.

## Acceptance criteria

- Unit test with the LLM stubbed: a supplied question/category/expiry ends up on the created market row.
- Duplicate questions are still rejected.

## Files likely touched

src/controllers/market.controller.ts, src/agents/market-maker.agent.ts, src/services/market.service.ts, tests/

## How to test

npm test

## Complexity

`medium`

## Labels

enhancement, agents, complexity: medium
