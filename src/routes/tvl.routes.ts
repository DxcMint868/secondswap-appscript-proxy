import { Router } from 'express';
import { getTvlData } from '../controllers/tvlController';

const router = Router();

// GET /tvl - Get TVL data for a specific network (with caching)
router.get('/', getTvlData);

export default router;
