import { Router } from 'express';
import { getTokensInfo as getTokensInfo } from '../controllers/tokenInfoController';

const router = Router();

// GET /tokens-info - Get token info for a specific chain (with caching)
router.get('/', getTokensInfo);

export default router;
