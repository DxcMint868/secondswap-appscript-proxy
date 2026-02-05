import { Request, Response } from 'express';
import config, { Network } from '../config/env';
import { getOrSet } from '../services/cacheService';
import { fetchVestingVaults } from '../services/duneService';
import { toDuneChain } from '../utils/chainMapping';

/**
 * Get vesting vaults for a specific chain
 * Uses cache to avoid repeated Dune API calls
 */
export const getVestingVaults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chain } = req.query;
    console.log(`chain: ${chain}`);

    if (!chain || typeof chain !== 'string') {
      res.status(400).json({
        error: "Chain is required",
        supportedChains: [...Object.values(Network), 'all']
      });
      return;
    }

    // Validate chain parameter - must be a valid Network or 'all'
    if (chain !== 'all' && !Object.values(Network).includes(chain as Network)) {
      res.status(400).json({
        error: "Unsupported chain",
        supportedChains: [...Object.values(Network), 'all']
      });
      return;
    }

    // Convert SecondSwap chain name to Dune chain name
    const duneChain = toDuneChain(chain);

    // Create cache key based on chain
    const CACHE_KEY = `vesting_vaults_${chain}`;

    // Get vesting vaults data (cached or fresh)
    const vaults = await getOrSet(
      CACHE_KEY,
      () => fetchVestingVaults(duneChain),
      config.cacheExpirationSecs
    );

    res.json({ vaults });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Vesting vaults fetch error:', message);
    res.status(500).json({ error: message });
  }
};
