import dotenv from 'dotenv';
dotenv.config();

/**
 * Supported blockchain networks
 */
export enum Network {
  ETHEREUM = 'ethereum',
  AVALANCHE_C_CHAIN = 'avalanche_c_chain',
  SOLANA = 'solana',
}

interface Config {
  port: number;
  apiSecret: string;
  duneApiKey: string | undefined;
  duneApiUrl: string;
  duneQueryIds: Record<string, number>;
  coingeckoApiUrl: string;
  supportedNetworks: readonly Network[];
  cacheExpirationSecs: number; // in seconds
  cacheRedisUrl: string | undefined;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  apiSecret: process.env.API_SECRET || '',
  duneApiKey: process.env.DUNE_API_KEY,
  duneApiUrl: 'https://api.dune.com/api/v1',
  duneQueryIds: {
    platform_tvl_by_network: 6182048
  } as const,
  coingeckoApiUrl: 'https://api.coingecko.com/api/v3',
  supportedNetworks: [Network.ETHEREUM, Network.AVALANCHE_C_CHAIN] as const,
  cacheExpirationSecs: 3600, // 1 hour in seconds
  cacheRedisUrl: process.env.CACHE_REDIS_URL,
};

// Validate required environment variables
if (!config.apiSecret) {
  throw new Error("API_SECRET is not defined in environment variables");
}

export default config;
