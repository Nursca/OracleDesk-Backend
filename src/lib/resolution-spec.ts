/**
 * Resolution specs and their commitment hash (ADR 0001 in the contracts repo).
 *
 * The hash is sha256(XDR(ResolutionSpec)), where ResolutionSpec is the
 * resolver contract's enum `Price(PriceConfig) | Signers(SignerConfig)`.
 * This must match contracts/oracledesk-stellar/scripts/spec-hash byte for
 * byte; tests/resolution-spec.test.ts checks it against fixtures produced
 * by that tool.
 *
 * PriceConfig and SignerConfig are encoded with the resolver binding's own
 * contract spec, so field order and types come from the contract rather than
 * from this file. ResolutionSpec itself is not in the binding (no entrypoint
 * takes it), so the enum wrapper is built here: a contracttype tuple variant
 * encodes as ScVec[ScSymbol(variant), value].
 */
import crypto from 'crypto';
import { StrKey, xdr } from '@stellar/stellar-sdk';
import { Client as ResolverClient } from '../generated/resolver';
import type { PriceConfig, SignerConfig } from '../generated/resolver';

export type PriceDirectionName = 'Above' | 'AtOrAbove' | 'Below' | 'AtOrBelow';

/** JSON-safe form, as stored in the database and returned by the API. */
export type ResolutionSpecJson =
  | {
      kind: 'price';
      reflector: string;
      asset: { kind: 'stellar'; address: string } | { kind: 'other'; symbol: string };
      threshold: string; // i128, decimal string
      direction: PriceDirectionName;
      maxStaleness: number; // seconds
    }
  | {
      kind: 'signers';
      signers: string[];
      threshold: number;
      disputeWindow: number; // seconds
    };

// The spec is all we need; the contract id and RPC are never used.
const resolverSpec = new ResolverClient({
  contractId: StrKey.encodeContract(Buffer.alloc(32)),
  rpcUrl: 'http://127.0.0.1:0',
  networkPassphrase: 'unused',
  allowHttp: true,
}).spec;

const udt = (name: string) => xdr.ScSpecTypeDef.scSpecTypeUdt(new xdr.ScSpecTypeUdt({ name }));

export function toPriceConfig(spec: Extract<ResolutionSpecJson, { kind: 'price' }>): PriceConfig {
  return {
    reflector: spec.reflector,
    asset:
      spec.asset.kind === 'stellar'
        ? { tag: 'Stellar', values: [spec.asset.address] as const }
        : { tag: 'Other', values: [spec.asset.symbol] as const },
    threshold: BigInt(spec.threshold),
    direction: { tag: spec.direction, values: undefined },
    max_staleness: BigInt(spec.maxStaleness),
  };
}

export function toSignerConfig(spec: Extract<ResolutionSpecJson, { kind: 'signers' }>): SignerConfig {
  return {
    signers: spec.signers,
    threshold: spec.threshold,
    dispute_window: BigInt(spec.disputeWindow),
  };
}

export function resolutionSpecScVal(spec: ResolutionSpecJson): xdr.ScVal {
  validateResolutionSpec(spec);
  const [variant, inner] =
    spec.kind === 'price'
      ? ['Price', resolverSpec.nativeToScVal(toPriceConfig(spec), udt('PriceConfig'))]
      : ['Signers', resolverSpec.nativeToScVal(toSignerConfig(spec), udt('SignerConfig'))];
  return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(variant), inner]);
}

/** sha256(XDR(ResolutionSpec)) as 32 bytes. */
export function resolutionHash(spec: ResolutionSpecJson): Buffer {
  return crypto.createHash('sha256').update(resolutionSpecScVal(spec).toXDR()).digest();
}

export function validateResolutionSpec(spec: ResolutionSpecJson): void {
  const isAddress = (a: string) => StrKey.isValidEd25519PublicKey(a) || StrKey.isValidContract(a);
  if (spec.kind === 'signers') {
    if (spec.signers.length === 0 || !spec.signers.every(isAddress)) throw new Error('signers must be Stellar addresses');
    if (!Number.isInteger(spec.threshold) || spec.threshold < 1 || spec.threshold > spec.signers.length) {
      throw new Error('threshold must be between 1 and the number of signers');
    }
    if (!Number.isInteger(spec.disputeWindow) || spec.disputeWindow < 0) throw new Error('disputeWindow must be >= 0');
    return;
  }
  if (!StrKey.isValidContract(spec.reflector)) throw new Error('reflector must be a C… contract id');
  if (spec.asset.kind === 'stellar' && !isAddress(spec.asset.address)) throw new Error('asset address is invalid');
  if (!/^-?\d+$/.test(spec.threshold)) throw new Error('threshold must be an integer string');
  if (!Number.isInteger(spec.maxStaleness) || spec.maxStaleness < 0) throw new Error('maxStaleness must be >= 0');
}
