import { Request, Response } from 'express';
import config, { Network } from '../config/env';
import { getOrSet } from '../services/cacheService';
import { fetchTVLAllNetworks, extractNetworkTVL } from '../services/duneService';

const CACHE_KEY = 'tvl_data_all_networks';

/**
 * Get TVL data for a specific network
 * Uses cache to avoid repeated Dune API calls
 */
export const getTvlData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { network } = req.query;
    console.log(`network: ${network}`);

    // // Temporary (TODO: update when Solana goes live)
    // if (network === Network.SOLANA) {
    //   res.json({ tvlUsd: 0 });
    // }

    if (!network || typeof network !== 'string') {
      res.status(400).json({
        error: "Network is required",
        supportedNetworks: Object.values(Network)
      });
      return;
    }

    // Type guard: check if network is a valid Network enum value
    if (!Object.values(Network).includes(network as Network)) {
      res.status(400).json({
        error: "Unsupported network",
        supportedNetworks: Object.values(Network)
      });
      return;
    }

    const validNetwork = network as Network;

    // Get TVL data for all networks (cached or fresh)
    const allNetworksTVL = await getOrSet(
      CACHE_KEY,
      fetchTVLAllNetworks,
      config.cacheExpirationSecs
    );

    // Extract data for the requested network
    const tvlUsd: number = extractNetworkTVL(allNetworksTVL, validNetwork);
    res.json({ tvlUsd });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('TVL fetch error:', message);
    res.status(500).json({ error: message });
  }
};

