import { Network } from '../config/env';

/**
 * Maps SecondSwap chain names to Dune chain names
 */
const CHAIN_MAPPING: Record<string, string> = {
  [Network.ETHEREUM]: 'ethereum',
  [Network.AVALANCHE_C_CHAIN]: 'avalanche_c',
  [Network.SOLANA]: 'solana',
  'all': 'all'
};

/**
 * Convert SecondSwap chain name to Dune chain name
 * @param secondSwapChain - The chain name from SecondSwap (e.g., 'avalanche_c_chain')
 * @returns The corresponding Dune chain name (e.g., 'avalanche_c')
 */
export const toDuneChain = (secondSwapChain: string): string => {
  const duneChain = CHAIN_MAPPING[secondSwapChain];
  
  if (!duneChain) {
    throw new Error(`Unknown chain: ${secondSwapChain}`);
  }
  
  return duneChain;
};
