import { Router } from 'express';
import { getResolution } from '../controllers/oracle.controller';

const router = Router();

// Read-only. POST /oracle/resolve was removed: outcomes are decided on-chain
// by the resolver contract, never by this API.
router.get('/markets/:marketId/resolution', getResolution);

export default router;
