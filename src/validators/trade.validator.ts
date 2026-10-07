import { z } from 'zod';

export const copyTradeSchema = z.object({
  body: z.object({
    traceId:   z.string().uuid('Invalid trace ID'),
    marketId:  z.string().uuid('Invalid market ID'),
    amountRaw: z.string().regex(/^[1-9]\d*$/, 'amountRaw must be a positive integer in 7-decimal USDC base units'),
  }),
});

export const confirmCopyTradeSchema = z.object({
  txHash: z.string().regex(/^[0-9a-fA-F]{64}$/, 'txHash must be a 64-character hex Stellar transaction hash'),
});

export const kellyInputSchema = z.object({
  agentProbability:  z.number().min(0).max(1),
  marketProbability: z.number().min(0).max(1),
  bankroll:          z.number().positive(),
  netOdds:           z.number().positive(),
});

export type CopyTradeInput = z.infer<typeof copyTradeSchema>['body'];
export type KellyInput = z.infer<typeof kellyInputSchema>;
