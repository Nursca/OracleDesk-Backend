## What this does

<!-- One or two sentences. "Closes #N" if it resolves an issue. -->

## Checklist

- [ ] `npm run check:contracts`, `npm run build` and `npm test` pass
- [ ] Schema changes come with a new, forward-only migration (existing migrations untouched)
- [ ] No secrets: no `.env` files, keys, seeds or tokens, in code, tests, fixtures or logs
- [ ] Anything that can submit a transaction still defaults to `dry-run`
- [ ] `docs/api.md` updated if a request or response shape changed
- [ ] `.env.example` updated if config changed

## How this was tested

<!-- Commands and output (e.g. scripts/smoke.sh against a local server). -->
