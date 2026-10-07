import { Router } from 'express';
import { initiateCopyTrade, confirmCopyTrade } from '../controllers/trade.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/copy',          requireAuth, initiateCopyTrade);
router.patch('/copy/:id/confirm', requireAuth, confirmCopyTrade);

export default router;
