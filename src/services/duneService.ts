import config, { type Network } from '../config/env';

/**
 * Dune API service - handles all Dune-specific operations
 */

interface DuneExecutionResponse {
  execution_id: string;
  state: string;
}

interface DuneResultResponse {
  execution_id: string;
  state: string;
  is_execution_finished: boolean;
  result?: {
    rows: unknown[];
    metadata?: unknown;
  };
  error?: {
    message: string;
  };
}

/**
 * Execute Dune query and return execution ID
 */
const executeQuery = async (queryId: number): Promise<string> => {
  const response = await fetch(`${config.duneApiUrl}/query/${queryId}/execute`, {
    headers: {
      "X-DUNE-API-KEY": config.duneApiKey!,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      query_parameters: {}
    }),
  });

  if (!response.ok) {
    throw new Error(`Dune execute error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as DuneExecutionResponse;
  return data.execution_id;
};

/**
 * Poll for query results until complete
 */
const pollForResults = async (executionId: string, maxAttempts = 60): Promise<unknown> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${config.duneApiUrl}/execution/${executionId}/results`, {
      headers: {
        "X-DUNE-API-KEY": config.duneApiKey!,
      },
    });

    if (!response.ok) {
      throw new Error(`Dune results error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as DuneResultResponse;

    if (data.is_execution_finished) {
      if (data.error) {
        throw new Error(`Dune query error: ${data.error.message}`);
      }
      return data.result?.rows || [];
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Dune query timeout: exceeded maximum polling attempts');
};

/**
 * Fetch TVL data from Dune for all networks
 * Returns TVL data for all supported networks in a single call
 */
export const fetchTVLAllNetworks = async (): Promise<unknown> => {
  if (!config.duneApiKey) {
    throw new Error("DUNE_API_KEY is not defined in environment variables");
  }

  const duneQueryId = config.duneQueryIds.platform_tvl_by_network;
  if (!duneQueryId) {
    throw new Error("Dune query ID (platform_tvl_by_network) is not configured");
  }

  console.log('Fetching TVL data from Dune API (all networks)...');

  // Step 1: Execute query
  const executionId = await executeQuery(duneQueryId);
  console.log(`Dune execution started: ${executionId}`);

  // Step 2: Poll for results
  const results = await pollForResults(executionId);
  console.log('TVL data received from Dune');

  return results;
};

/**
 * Extract TVL data for a specific network
 * Assumes Dune response has network data keyed by network name
 */
export const extractNetworkTVL = (allNetworksData: unknown, network: Network): number => {
  // Parse the data if it's a string
  const parsedData = typeof allNetworksData === 'string'
    ? JSON.parse(allNetworksData)
    : allNetworksData;

  if (parsedData && Array.isArray(parsedData)) {
    const networkData = parsedData.find((item) => item['network_name'] === network)
    if (networkData) {
      return parseFloat(networkData['tvl_usd'])
    }
    throw new Error(`Network "${network}" not found in Dune response`);
  } else {
    throw new Error(`Unknown data format: ${JSON.stringify(parsedData)}`);
  }
};
