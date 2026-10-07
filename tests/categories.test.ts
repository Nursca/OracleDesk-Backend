import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnv } from './helpers/env';

setupTestEnv();

// If either list changes, this test fails on purpose: update
// toContractCategory() and docs/api.md, then these snapshots.
const BACKEND = ['FED', 'ECB', 'ELECTION', 'GEOPOLITICAL', 'CRYPTO', 'MACRO', 'SPORTS', 'ENTERTAINMENT', 'POLITICS'];
const CONTRACT = ['Crypto', 'Macro', 'Geopolitics', 'Sports', 'Culture', 'Other'];

test('backend MarketCategory enum matches the snapshot', async () => {
  const { MarketCategory } = await import('@prisma/client');
  assert.deepEqual(Object.values(MarketCategory).sort(), [...BACKEND].sort());
});

test('contract Category enum (from the market-core spec) matches the snapshot', async () => {
  const { readClients } = await import('../src/services/stellar/clients');
  const entry = readClients.marketCore().spec.findEntry('Category');
  const cases = entry.udtUnionV0().cases().map((c) => c.value().name().toString());
  assert.deepEqual(cases.sort(), [...CONTRACT].sort());
});

test('toContractCategory maps every backend category onto a contract category', async () => {
  const { toContractCategory } = await import('../src/lib/categories');
  const expected: Record<string, string> = {
    FED: 'Macro', ECB: 'Macro', MACRO: 'Macro',
    GEOPOLITICAL: 'Geopolitics', ELECTION: 'Geopolitics', POLITICS: 'Geopolitics',
    CRYPTO: 'Crypto', SPORTS: 'Sports', ENTERTAINMENT: 'Culture',
  };
  for (const c of BACKEND) {
    const mapped = toContractCategory(c as any);
    assert.equal(mapped, expected[c], c);
    assert.ok(CONTRACT.includes(mapped));
  }
  assert.throws(() => toContractCategory('NEW_THING' as any), /Unmapped/);
});
