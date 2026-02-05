import { Router } from 'express';
import { getVestingVaults } from '../controllers/vestingVaultsController';

const router = Router();

// GET /vesting-vaults - Get vesting vaults for a specific chain (with caching)
router.get('/', getVestingVaults);

export default router;
