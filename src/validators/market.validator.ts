// This file validates incoming requests for market-related endpoints using Zod schemas. 
// It defines the expected structure of the request body and query parameters for creating and listing markets, ensuring that the data adheres to the specified formats and constraints before being processed by the controllers.

import { z } from 'zod';

// All nine categories — kept in sync with prisma MarketCategory enum
const MARKET_CATEGORIES = [
  'FED', 'ECB', 'ELECTION', 'GEOPOLITICAL',
  'CRYPTO', 'MACRO', 'SPORTS', 'ENTERTAINMENT', 'POLITICS',
] as const;

export const createMarketSchema = z.object({
  body: z.object({
    question: z.string().min(10, 'Question must be at least 10 characters'),
    category: z.enum(MARKET_CATEGORIES),
    settlementCurrency: z.literal('USDC').default('USDC'),
    expiryTimestamp: z.number().int().positive(),
    resolutionOracle: z.string().optional(),
    minimumLiquidity: z.number().positive().default(100),
  }),
});

export const listMarketsSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'ACTIVE', 'RESOLVING', 'RESOLVED', 'CANCELLED']).optional(),
    category: z.enum(MARKET_CATEGORIES).optional(),
    currency: z.literal('USDC').optional(),
    onChain: z.enum(['true', 'false']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>['body'];
export type MarketCategoryValue = typeof MARKET_CATEGORIES[number];

export const generateMarketSchema = z.object({
  question: z.string().min(10).max(300).optional(),
  category: z.enum(MARKET_CATEGORIES).optional(),
  expiry: z.string().optional(),
}).optional();
