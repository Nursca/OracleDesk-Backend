import crypto from 'crypto';

/**
 * Deterministic JSON: object keys sorted recursively, no whitespace, bigints
 * as decimal strings. Same rules as agents/core/trace.ts `canonicalize` in
 * the contracts repo, so a trace hashes the same on both sides.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) sorted[key] = sortKeysDeep(v);
    }
    return sorted;
  }
  return value;
}

/** Canonical bytes for a JSON document. Hash and upload these exact bytes. */
export function canonicalBytes(value: unknown): Buffer {
  return Buffer.from(canonicalJson(value), 'utf8');
}

export function sha256Hex(bytes: Uint8Array | string): string {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

/** Same check as x402/trace-verification.ts in the contracts repo. */
export function verifyTraceHash(content: Uint8Array, expectedHash: string): boolean {
  const normalized = expectedHash.toLowerCase().replace(/^0x/, '');
  return /^[0-9a-f]{64}$/.test(normalized) && sha256Hex(content) === normalized;
}
