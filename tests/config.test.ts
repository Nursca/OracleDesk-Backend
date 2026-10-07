import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@stellar/stellar-sdk';
import { setupTestEnv } from './helpers/env';

setupTestEnv();

test('config names every missing or invalid variable', async () => {
  const { loadConfig } = await import('../src/config');
  assert.throws(() => loadConfig({}), /DATABASE_URL is required/);
  assert.throws(() => loadConfig({ DATABASE_URL: 'x', ADMIN_ADDRESSES: '0xabc' }), /ADMIN_ADDRESSES/);
  assert.throws(() => loadConfig({ DATABASE_URL: 'x', CHAIN_EXECUTION_MODE: 'live' }), /AGENT_SECRET_KEY is required/);
  assert.throws(() => loadConfig({ DATABASE_URL: 'x', CHAIN_EXECUTION_MODE: 'mock' }), /CHAIN_EXECUTION_MODE/);
  assert.throws(
    () => loadConfig({ DATABASE_URL: 'x', CHAIN_EXECUTION_MODE: 'live', AGENT_SECRET_KEY: Keypair.random().secret(), STELLAR_NETWORK_PASSPHRASE: 'Public Global Stellar Network ; September 2015' }),
    /testnet-only/,
  );
  assert.throws(() => loadConfig({ DATABASE_URL: 'x', NODE_ENV: 'production' }), /JWT_SECRET is required in production/);
});

test('defaults to dry-run on testnet, and generates dev-only ephemeral secrets', async () => {
  const { loadConfig } = await import('../src/config');
  const c = loadConfig({ DATABASE_URL: 'x' });
  assert.equal(c.CHAIN_EXECUTION_MODE, 'dry-run');
  assert.equal(c.STELLAR_NETWORK_PASSPHRASE, 'Test SDF Network ; September 2015');
  assert.deepEqual(c.ephemeralSecrets.sort(), ['AUTH_SIGNING_SECRET', 'JWT_SECRET']);
});
