import { Router } from 'express';
import { getPlatformStats, getPortfolio, getPositions } from '../controllers/portfolio.controller';

const router = Router();

// Public (agent portfolio is public for demo)
router.get('/',          getPortfolio);
router.get('/positions', getPositions);
router.get('/stats',     getPlatformStats);

export default router;
