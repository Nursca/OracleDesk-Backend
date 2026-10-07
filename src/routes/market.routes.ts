import { Router } from 'express';
import {
  listMarkets,
  getMarket,
  getMarketByOnChainId,
  triggerMarketGeneration,
  getMarketGenerationStatus,
} from '../controllers/market.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { generateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

// Public — no auth needed
router.get('/', listMarkets);
router.get('/on-chain/:onChainMarketId', getMarketByOnChainId);

// Admin only: each run calls paid LLM APIs and the treasury.
router.post('/generate', generateLimiter, requireAuth, requireAdmin, triggerMarketGeneration);
router.get('/generation-status/:jobId', requireAuth, getMarketGenerationStatus);

router.get('/:id', getMarket);

export default router;
