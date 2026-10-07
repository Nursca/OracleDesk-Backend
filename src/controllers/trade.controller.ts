import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response.util';
import { checkAccess } from '../services/subscription.service';
import { CONTRACTS } from '../config/contracts';
import { toDisplayUsdc } from '../lib/amounts';
import { confirmCopyTradeSchema, copyTradeSchema } from '../validators/trade.validator';

/**
 * POST /trade/copy
 * Records a subscriber's intent to copy an agent trade and returns what the
 * wallet must sign: market_core.buy on the trace's market and side.
 *
 * The user signs in their own wallet; the backend never trades for them.
 * min_shares_out is not included because it must come from a quote taken
 * right before signing.
 */
export async function initiateCopyTrade(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required to copy-trade');
    return;
  }

  const parsed = copyTradeSchema.safeParse({ body: req.body });
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid copy-trade parameters',
      parsed.error.flatten().fieldErrors as any);
    return;
  }

  const { traceId, marketId, amountRaw } = parsed.data.body;

  const access = await checkAccess(req.user.userId, traceId);
  if (!access.hasAccess) {
    sendError(res, 403, 'TRACE_LOCKED', 'Unlock this trace before copying it');
    return;
  }

  const trace = await prisma.reasoningTrace.findUnique({
    where: { id: traceId },
    include: { market: true },
  });
  if (!trace) {
    sendError(res, 404, 'TRACE_NOT_FOUND', 'Reasoning trace not found');
    return;
  }
  if (trace.marketId !== marketId) {
    sendError(res, 400, 'MARKET_MISMATCH', 'traceId and marketId do not match');
    return;
  }

  const market = trace.market;
  if (market.onChainMarketId === null) {
    sendError(res, 409, 'MARKET_NOT_ON_CHAIN', 'This market is not on-chain yet');
    return;
  }
  if (market.status !== 'ACTIVE') {
    sendError(res, 409, 'MARKET_NOT_ACTIVE', 'Market is not active for trading');
    return;
  }
  // No edge means no side to copy. Never default to YES.
  if (!trace.edge) {
    sendError(res, 422, 'NO_EDGE', 'This trace has no edge, so there is no trade to copy');
    return;
  }
  const direction = trace.edge > 0 ? 'YES' : 'NO';

  const copyTrade = await prisma.copyTrade.create({
    data: {
      userId:    req.user.userId,
      traceId,
      marketId,
      direction,
      amount:    toDisplayUsdc(BigInt(amountRaw)),
      amountRaw,
      status:    'PENDING',
    },
  });

  sendSuccess(res, {
    copyTradeId: copyTrade.id,
    transactionPayload: {
      contractId:      CONTRACTS.marketCore,
      onChainMarketId: market.onChainMarketId.toString(),
      outcome:         direction === 'YES' ? 'Yes' : 'No',
      collateralInRaw: amountRaw,
      userWallet:      req.user.walletAddress,
      traceReference:  trace.ipfsCid,
    },
    instructions: 'Quote, then sign market_core.buy with min_shares_out from the quote. ' +
                  'Then call PATCH /trade/copy/:id/confirm with the transaction hash.',
  }, 200);
}

/**
 * PATCH /trade/copy/:id/confirm
 * Records the hash of the user's buy transaction.
 */
export async function confirmCopyTrade(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    return;
  }

  const id = String(req.params.id);
  const parsed = confirmCopyTradeSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'txHash is required', parsed.error.flatten().fieldErrors as any);
    return;
  }

  const copyTrade = await prisma.copyTrade.findUnique({ where: { id } });
  if (!copyTrade || copyTrade.userId !== req.user.userId) {
    sendError(res, 404, 'COPY_TRADE_NOT_FOUND', 'Copy trade not found');
    return;
  }

  const updated = await prisma.copyTrade.update({
    where: { id },
    data:  { txHash: parsed.data.txHash.toLowerCase(), status: 'EXECUTED' },
  });

  sendSuccess(res, updated);
}
