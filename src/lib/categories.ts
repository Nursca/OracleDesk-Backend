import type { MarketCategory } from '@prisma/client';
import type { Category } from '../generated/market-core';

export type ContractCategoryTag = Category['tag'];

/**
 * Maps the backend's display categories onto the contract's `Category` enum.
 * The switch is exhaustive: adding a backend category without mapping it is
 * a compile error, and tests/categories.test.ts fails if either enum changes.
 */
export function toContractCategory(category: MarketCategory): ContractCategoryTag {
  switch (category) {
    case 'FED':
    case 'ECB':
    case 'MACRO':
      return 'Macro';
    case 'GEOPOLITICAL':
    case 'ELECTION':
    case 'POLITICS':
      return 'Geopolitics';
    case 'CRYPTO':
      return 'Crypto';
    case 'SPORTS':
      return 'Sports';
    case 'ENTERTAINMENT':
      return 'Culture';
    default: {
      const unmapped: never = category;
      throw new Error(`Unmapped market category: ${String(unmapped)}`);
    }
  }
}

export function toContractCategoryValue(category: MarketCategory): Category {
  return { tag: toContractCategory(category), values: undefined } as Category;
}
