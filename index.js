const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

const apiSecret = process.env.API_SECRET;
if (!apiSecret) {
  throw new Error("API_SECRET is not defined in environment variables");
}

app.get("/coin/:coingeckoId", async (req, res) => {
  if (req.query.apiSecret !== apiSecret) {
    return res.status(401).json({ error: "Invalid API secret" });
  }

  const { coingeckoId } = req.params;
  const r = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coingeckoId}`
  );
  const json = await r.json();
  res.json(json);
});

app.listen(3000, () => console.log("Proxy running"));
