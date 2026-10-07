import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { setupTestEnv } from './helpers/env';

setupTestEnv();

test('USDC amounts use 7 decimals and never go through floats', async () => {
  const { parseUsdc, formatUsdc, usdcFromNumber, parseU64 } = await import('../src/lib/amounts');
  assert.equal(parseUsdc('1'), 10_000_000n);
  assert.equal(parseUsdc('0.0000001'), 1n);
  assert.equal(parseUsdc('123.4567891'), 1_234_567_891n);
  assert.throws(() => parseUsdc('0.00000001'));
  assert.throws(() => parseUsdc('1e5'));
  assert.throws(() => parseUsdc('abc'));
  assert.equal(formatUsdc(1n), '0.0000001');
  assert.equal(formatUsdc(15_000_000n), '1.5');
  assert.equal(usdcFromNumber(0.1), 1_000_000n);
  assert.equal(parseU64('0'), 0n);
  assert.equal(parseU64('18446744073709551616'), null);
  assert.equal(parseU64('-1'), null);
});

test('canonical JSON sorts nested keys and hashes the exact bytes', async () => {
  const { canonicalJson, canonicalBytes, sha256Hex, verifyTraceHash } = await import('../src/utils/hash.util');
  assert.equal(canonicalJson({ b: 1, a: { d: 2n, c: [3, { f: 1, e: 2 }] } }), '{"a":{"c":[3,{"e":2,"f":1}],"d":"2"},"b":1}');
  const bytes = canonicalBytes({ z: 1, a: 2 });
  assert.equal(sha256Hex(bytes), crypto.createHash('sha256').update('{"a":2,"z":1}').digest('hex'));

  // Same fixtures as x402/trace-verification.test.ts in the contracts repo.
  const content = new TextEncoder().encode('{"action":"buy","confidence":0.72}');
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  assert.equal(verifyTraceHash(content, hash), true);
  assert.equal(verifyTraceHash(content, `0x${hash}`), true);
  assert.equal(verifyTraceHash(new TextEncoder().encode('{}'), hash), false);
  assert.equal(verifyTraceHash(content, 'not-a-hash'), false);
});

test('trace hash is the sha256 of the exact bytes pinned, and re-fetched bytes match it', async () => {
  const { pinJson, fetchIpfsBytes, setIpfsTransport } = await import('../src/services/ipfs.service');
  const { sha256Hex } = await import('../src/utils/hash.util');
  const store = new Map<string, Buffer>();
  const prev = setIpfsTransport({
    async pin(bytes) {
      const cid = `bafyfake${store.size}`;
      store.set(cid, Buffer.from(bytes));
      return cid;
    },
    async fetch(cid) {
      const bytes = store.get(cid);
      if (!bytes) throw new Error('missing');
      return bytes;
    },
  });
  try {
    const trace = { reasoning: 'Rates hold', inputs: { fed: 0.7, nested: { b: 1, a: 2 } }, amount: 10n };
    const pinned = await pinJson(trace, 'trace-test');
    const refetched = await fetchIpfsBytes(pinned.cid);
    assert.equal(sha256Hex(refetched), pinned.hash);
    assert.ok(refetched.equals(pinned.bytes));
    // Re-serialising the parsed object in a different key order would not match.
    const reordered = Buffer.from(JSON.stringify({ reasoning: 'Rates hold', amount: '10', inputs: trace.inputs }));
    assert.notEqual(sha256Hex(reordered), pinned.hash);
  } finally {
    setIpfsTransport(prev);
  }
});
