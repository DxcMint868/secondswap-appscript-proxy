import { Router } from 'express';
import coingeckoRoutes from './coingecko.routes';
import tvlRoutes from './tvl.routes';
import vestingVaultsRoutes from './vestingVaults.routes';
import tokenInfoRoutes from './tokenInfo.routes';

const router = Router();

// Mount routes - preserving original endpoint paths
router.use('/coin', coingeckoRoutes);
router.use('/tvl', tvlRoutes);
router.use('/vesting-vaults', vestingVaultsRoutes);
router.use('/tokens-info', tokenInfoRoutes);

export default router;
