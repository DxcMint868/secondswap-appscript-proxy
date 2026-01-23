import { Request, Response } from 'express';
import config from '../config/env';

/**
 * Get coin data from CoinGecko API
 */
export const getCoinData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { coingeckoId } = req.params;
    const response = await fetch(
      `${config.coingeckoApiUrl}/coins/${coingeckoId}`
    );
    const json = await response.json();
    res.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};
