import { Router } from 'express';
import { postChallenge, postVerify } from '../controllers/auth.controller';
import { authLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

router.post('/challenge', authLimiter, postChallenge);
router.post('/verify', authLimiter, postVerify);

export default router;
