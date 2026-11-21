import fs from "fs";

const key = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("=")[1].trim();
const headers = { "X-CMC_PRO_API_KEY": key, Accept: "application/json" };

async function get(path, params) {
  const url = new URL("https://pro-api.coinmarketcap.com" + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers });
  const body = await res.json();
  const status = body.status ?? {};
  console.log(path, res.status, "credits", status.credit_count, status.error_message || "ok");
  return body;
}

const quotes = await get("/v5/real-world-assets/quotes/latest", {
  symbol: "NVDA,GOLD,SPY,AAPL,TSLA",
  convert: "USD",
  skip_invalid: "true",
});
const map = await get("/v5/real-world-assets/map", { start: "1", limit: "1" });
const issuers = await get("/v5/real-world-assets/issuers/list", { start: "1", limit: "250" });
const assets = quotes.data?.rwa_assets ?? [];
for (const asset of assets) {
  const tokens = asset.tokens ?? [];
  console.log(
    asset.symbol,
    "rwa",
    asset.rwa_id,
    "type",
    asset.asset_type,
    "tokens",
    tokens.length,
    tokens.map((token) => `${token.symbol}:${token.issuer_name}:${token.volume_24h}`).join(" | "),
  );
}
const ids = [...new Set(assets.flatMap((asset) => (asset.tokens ?? []).map((token) => token.crypto_id)).filter(Boolean))];
const info = ids.length
  ? await get("/v2/cryptocurrency/info", { id: ids.slice(0, 80).join(",") })
  : null;
if (info?.data) {
  const rows = Object.values(info.data).flatMap((value) => (Array.isArray(value) ? value : [value]));
  console.log(
    "chains",
    rows.map((row) => `${row.symbol}:${row.platform?.name ?? row.contract_address?.[0]?.platform?.name ?? "-"}`).join(" | "),
  );
}
fs.mkdirSync(new URL("../data/fixtures", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../data/fixtures/quotes-latest.json", import.meta.url), JSON.stringify(quotes));
fs.writeFileSync(new URL("../data/fixtures/map.json", import.meta.url), JSON.stringify(map));
fs.writeFileSync(new URL("../data/fixtures/issuers-list.json", import.meta.url), JSON.stringify(issuers));
if (info) fs.writeFileSync(new URL("../data/fixtures/crypto-info.json", import.meta.url), JSON.stringify(info));
