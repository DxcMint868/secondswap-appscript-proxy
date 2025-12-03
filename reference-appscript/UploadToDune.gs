function uploadToDune() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  //
  // --------------------------
  //      TOKEN SHEET UPDATE
  // --------------------------
  //

  var tokenSheet = ss.getSheetByName("Tokens");
  var tokenRange = tokenSheet.getDataRange();
  var tokenValues = tokenRange.getValues(); // includes header row
  var proxyApiSecret = "<PROXY_API_SECRET>";

  const getTokenInfo = function (coingeckoId) {
    let attempts = 0;

    while (attempts < 3) {
      attempts++;

      try {
        const res = UrlFetchApp.fetch(
          // `https://api.coingecko.com/api/v3/coins/${coingeckoId}`, // Will get 429 rate limit error as all user scripts share the same Google server's IP range.
          `https://secondswap-appscript-proxy.vercel.app/coin/${coingeckoId}?apiSecret=${proxyApiSecret}`, // Deploy our own proxy server on vercel
          { method: "get" }
        );

        const tokenInfo = JSON.parse(res.getContentText());

        return {
          symbol: String(tokenInfo.symbol).toUpperCase(),
          detailPlatforms: tokenInfo.detail_platforms,
          price: tokenInfo.market_data.current_price.usd,
        };
      } catch (err) {
        Logger.log(
          `Error fetching ${coingeckoId} (attempt ${attempts}): ${err}`
        );
        if (attempts < 3) {
          Utilities.sleep(30000 * attempts);
        }
      }
    }

    Logger.log("Failed after 3 attempts: " + coingeckoId);
    return null;
  };

  const tokenInfoCache = new Map();

  // Build CSV + update sheet
  var tokenData = tokenValues[0].join(",") + "\n"; // Init csv data with header row from sheets

  // Start from row 1 (skip header)
  for (var i = 1; i < tokenValues.length; i++) {
    const coinGeckoId = tokenValues[i][0];

    if (!coinGeckoId) continue;

    let info = tokenInfoCache.get(coinGeckoId);
    if (!info) {
      info = getTokenInfo(coinGeckoId);
      if (!info) continue;
      tokenInfoCache.set(coinGeckoId, info);
    }

    // Update symbol if empty
    if (!tokenValues[i][1]) tokenValues[i][1] = info.symbol;

    // Update price
    tokenValues[i][2] = info.price;

    tokenData += tokenValues[i].join(",") + "\n";
  }

  // Write updated values back to Token sheet
  tokenRange.setValues(tokenValues);

  //
  // ------------------------------------
  //   TOKEN CONTRACTS — SECTION REWRITE
  // ------------------------------------
  //

  var COINGECKO_PLATFORM_TO_DUNE_CHAIN = {
    ethereum: "ethereum",
    avalanche: "avalanche_c",
    base: "base",
    "binance-smart-chain": "bnb",
    "arbitrum-nova": "nova",
    "arbitrum-one": "arbitrum",
    opbnb: "opbnb",
    "optimistic-ethereum": "optimism",
    berachain: "berachain",
    zksync: "zksync",
    taiko: "taiko",
    tron: "tron",
    "plume-network": "plume",
    "world-chain": "worldchain",
    abstract: "abstract",
    hyperevm: "hyperevm",
    somnia: "somnia",
    unichain: "unichain",
    // To be expanded...
  };

  var contractSheet = ss.getSheetByName("TokenContracts");
  var contractRange = contractSheet.getDataRange();
  var contractValues = contractRange.getValues();

  const header = contractValues[0];
  const rows = contractValues.slice(1);

  // Group existing rows by Coingecko ID
  const grouped = new Map();

  rows.forEach((row) => {
    const id = row[0];
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(row);
  });

  const now = new Date().toISOString();
  const ONE_MONTH_IN_MILISECS = 30 * 24 * 3600 * 1000;

  const isOutdated = (dateObj) => {
    if (!dateObj) return true;

    // Convert string to Date if necessary
    const date = dateObj instanceof Date ? dateObj : new Date(dateObj);

    if (isNaN(date.getTime())) return true; // invalid date

    return now - date > ONE_MONTH_IN_MILISECS;
  };

  // For each token we fetched earlier:
  for (const [coingeckoId, info] of tokenInfoCache) {
    const platformMap = info.detailPlatforms;

    // Check if exists in the sheet
    if (grouped.has(coingeckoId)) {
      const block = grouped.get(coingeckoId);

      const outdated = block.some((row) => isOutdated(row[4]));

      if (outdated) {
        Logger.log(`Refreshing outdated contract rows for ${coingeckoId}`);
        grouped.delete(coingeckoId);
      } else {
        // If up-to-date, skip replacing content
        continue;
      }
    }

    // Build new rows

    const newRows = [];

    for (const platformName in platformMap) {
      const platform = platformMap[platformName];
      const duneChainName = COINGECKO_PLATFORM_TO_DUNE_CHAIN[platformName];
      if (!duneChainName) {
        Logger.log(
          `Could not find Dune chain name for coingecko platform ${platformName}, skipping...`
        );
        continue;
      }

      newRows.push([
        coingeckoId,
        duneChainName,
        platform.contract_address || "",
        platform.decimal_place || "",
        new Date().toISOString(), // updated_at
      ]);
    }

    grouped.set(coingeckoId, newRows);
  }

  //
  // --- Rebuild TokenContracts sheet ---
  //
  const finalRows = [header];
  let tokenContractsData = header.join(",") + "\n";

  for (const rowList of grouped.values()) {
    finalRows.push(...rowList);

    for (const row of rowList) {
      tokenContractsData += row.join(",") + "\n";
    }
  }

  // Rewrite sheet
  contractSheet.clearContents();
  contractSheet
    .getRange(1, 1, finalRows.length, finalRows[0].length)
    .setValues(finalRows);

  //
  // --------------------------
  //      UPLOAD TO DUNE
  // --------------------------
  //
  var duneApiKey = "<DUNE_API_KEY>";

  Logger.log("Tokens sheet data:");
  Logger.log(tokenData);
  Logger.log("Uploading Tokens sheet data...:");
  var response = UrlFetchApp.fetch("https://api.dune.com/api/v1/uploads/csv", {
    method: "post",
    contentType: "application/json",
    headers: { "X-DUNE-API-KEY": duneApiKey },
    muteHttpExceptions: false,
    payload: JSON.stringify({
      data: tokenData.trim(),
      description: "Custom Token Prices",
      table_name: "custom_token_prices",
      is_private: false,
    }),
  });
  Logger.log(response.getContentText());

  Logger.log("TokenContracts sheet data:");
  Logger.log(tokenContractsData);
  Logger.log("Uploading TokenContracts sheet data...");
  response = UrlFetchApp.fetch("https://api.dune.com/api/v1/uploads/csv", {
    method: "post",
    contentType: "application/json",
    headers: { "X-DUNE-API-KEY": duneApiKey },
    muteHttpExceptions: false,
    payload: JSON.stringify({
      data: tokenContractsData.trim(),
      description: "Custom Token Contracts",
      table_name: "custom_token_contracts",
      is_private: false,
    }),
  });
  Logger.log(response.getContentText());
}
