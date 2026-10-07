import { Router } from 'express';
import {
  getMyPaymentEvents,
  getMySpendingAllowance,
  getTrace,
  listTraces,
  setSpendingAllowance,
  unlockTrace,
  verifyTrace,
} from '../controllers/trace.controller';
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Public
router.get('/',             listTraces);
router.get('/access/allowance', requireAuth, getMySpendingAllowance);
router.put('/access/allowance', requireAuth, setSpendingAllowance);
router.get('/payments', requireAuth, getMyPaymentEvents);
router.get('/:id', optionalAuth, getTrace);   // Preview without a token, full trace with a daily pass

// Protected
router.post('/verify',       requireAuth, verifyTrace);
router.post('/:id/unlock',   requireAuth, unlockTrace);

export default router;
