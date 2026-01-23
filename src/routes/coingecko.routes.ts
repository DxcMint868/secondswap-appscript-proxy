import { Router } from 'express';
import { validateApiSecret } from '../middleware/auth';
import { getCoinData } from '../controllers/coingeckoController';

const router = Router();

// GET /coin/:coingeckoId
router.get('/:coingeckoId', validateApiSecret, getCoinData);

export default router;
