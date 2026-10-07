import { Errors as MarketCoreErrors } from '../../generated/market-core';
import { Errors as TreasuryErrors } from '../../generated/treasury';
import { Errors as ResolverErrors } from '../../generated/resolver';
import { Errors as ReasoningRegistryErrors } from '../../generated/reasoning-registry';
import { AppError } from '../../middlewares/error.middleware';

const TABLES: Record<string, Record<number, { message: string }>> = {
  marketCore: MarketCoreErrors,
  treasury: TreasuryErrors,
  resolver: ResolverErrors,
  reasoningRegistry: ReasoningRegistryErrors,
};

/** Name of a contract error, e.g. "SlippageExceeded", from an Err or a raw host error string. */
export function contractErrorName(contract: keyof typeof TABLES, err: unknown): string | null {
  if (err && typeof err === 'object' && 'error' in err) {
    const inner = (err as { error?: { message?: string } }).error;
    if (inner?.message) return inner.message;
  }
  const text = err instanceof Error ? err.message : String(err);
  const match = text.match(/Error\(Contract, #(\d+)\)/);
  if (!match) return null;
  return TABLES[contract][Number(match[1])]?.message ?? `ContractError${match[1]}`;
}

export class ChainError extends AppError {
  constructor(message: string, public readonly contractError: string | null, details?: Record<string, unknown>) {
    super(502, 'CHAIN_ERROR', message, { contractError, ...details });
    this.name = 'ChainError';
  }
}
