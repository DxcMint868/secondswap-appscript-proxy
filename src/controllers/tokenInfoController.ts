import { Request, Response } from 'express';
import config, { Network } from '../config/env';
import { getOrSet } from '../services/cacheService';
import { fetchTokenInfo } from '../services/duneService';
import { toDuneChain } from '../utils/chainMapping';

/**
 * Get token info for a specific chain
 * Uses cache to avoid repeated Dune API calls
 */
export const getTokensInfo = async (req: Request, res: Response): Promise<void> => {
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
    const CACHE_KEY = `tokens_info_${chain}`;

    // Get token info data (cached or fresh)
    const tokens = await getOrSet(
      CACHE_KEY,
      () => fetchTokenInfo(duneChain),
      config.cacheExpirationSecs
    );

    res.json({ tokens });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Token info fetch error:', message);
    res.status(500).json({ error: message });
  }
};
