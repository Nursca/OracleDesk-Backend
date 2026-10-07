import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnv } from './helpers/env';

setupTestEnv();

// Expected hashes produced by the contracts repo's Rust tool
// (contracts/oracledesk-stellar/scripts/spec-hash) at commit eb5f3fd:
//   spec-hash signers 1 3600 GCM7…XAIF
//   spec-hash signers 2 0 GCM7…XAIF GD2N…QGHQ
//   spec-hash price CDDJ…VYGR other:BTC 1000000000000000 at-or-above 900
//   spec-hash price CDDJ…VYGR stellar:CA2W…REQH -5 below 60
const AGENT = 'GCM7WU3RADBCIKBLGPPAEYV5WHASWMEQX6BU524QR3QFWSE7BIWCXAIF';
const DEPLOYER = 'GD2NB2VUME7ECMHFHQN5M3KUZLLJF3R6Z4OFCBLE4SJNHIQHITRPQGHQ';
const REFLECTOR = 'CDDJU3PH6T3Z4O6EYLALXXB5XBFPYO2G5P5RBDEIZ7ZVN6V37OQSVYGR';
const USDC = 'CA2WQQJ4OHQCLHQW6XN4BCLILGRV6V4YDYDT3GVIWXB53BTOO7EMREQH';

const FIXTURES = [
  {
    spec: { kind: 'signers', signers: [AGENT], threshold: 1, disputeWindow: 3600 },
    hash: '4ef7a0fb3ef86ff6aaba1538b4bbd82480c98df42b1573957d8c9d48d568c50d',
  },
  {
    spec: { kind: 'signers', signers: [AGENT, DEPLOYER], threshold: 2, disputeWindow: 0 },
    hash: '1bd304d2119f3471b67e6d3f4cce1b6dfc9b033544391377d5c289a3aa628710',
  },
  {
    spec: { kind: 'price', reflector: REFLECTOR, asset: { kind: 'other', symbol: 'BTC' }, threshold: '1000000000000000', direction: 'AtOrAbove', maxStaleness: 900 },
    hash: 'a35631a6dbbe6a7f3d8e43853649f247172261a6559e06dc834210cc919d0ac4',
  },
  {
    spec: { kind: 'price', reflector: REFLECTOR, asset: { kind: 'stellar', address: USDC }, threshold: '-5', direction: 'Below', maxStaleness: 60 },
    hash: '771d8cf48def8fc27cd994f514ae5b3962b3845266546c74931fce8ee5563fb0',
  },
] as const;

test('resolutionHash matches scripts/spec-hash for signer and price specs', async () => {
  const { resolutionHash } = await import('../src/lib/resolution-spec');
  for (const { spec, hash } of FIXTURES) {
    assert.equal(resolutionHash(spec as any).toString('hex'), hash, JSON.stringify(spec));
  }
});

test('resolution specs are validated before hashing', async () => {
  const { resolutionHash } = await import('../src/lib/resolution-spec');
  assert.throws(() => resolutionHash({ kind: 'signers', signers: [AGENT], threshold: 2, disputeWindow: 0 }), /threshold/);
  assert.throws(() => resolutionHash({ kind: 'signers', signers: ['not-an-address'], threshold: 1, disputeWindow: 0 }), /signers/);
});
