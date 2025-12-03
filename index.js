const express = require("express");

const app = express();

app.get("/cg/:id", async (req, res) => {
  const id = req.params.id;
  const r = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
  const json = await r.json();
  res.json(json);
});

app.listen(3000, () => console.log("Proxy running"));
