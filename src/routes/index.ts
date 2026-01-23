import { Router } from 'express';
import coingeckoRoutes from './coingecko.routes';
import tvlRoutes from './tvl.routes';

const router = Router();

// Mount routes - preserving original endpoint paths
router.use('/coin', coingeckoRoutes);
router.use('/tvl', tvlRoutes);

export default router;
