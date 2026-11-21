# WrapWise

WrapWise compares tokenized wrappers of the same real-world asset and shows which one is closest to fair value, in dollars.

The problem: the same stock or metal can trade through several tokenized wrappers at different prices, with different liquidity and different issuers. Checking each wrapper by hand is slow and error-prone. The solution: WrapWise pulls wrapper prices from the CoinMarketCap API, builds one aggregate anchor price, scores every wrapper on fairness, liquidity, and issuer strength, and translates the result into a dollar answer for the amount you enter. It is a comparison tool, not financial advice.

WrapWise uses the free CoinMarketCap API. The free Startup tier is enough for this app, with some limitations described below.

## What it does

- Search a curated set of assets: NVDA, Gold, SPY, AAPL, and TSLA.
- Compare every tokenized wrapper of the selected asset on one screen.
- See the best eligible wrapper, the premium or discount against the anchor, and what your dollar amount actually buys.
- Inspect liquidity, issuer strength, chain, quote age, and premium history.
- Works with live data when a key is configured, and falls back to cached or recorded fixtures otherwise, with the source clearly labeled.

## How it works

1. Pick an asset and a dollar amount, for example `/?asset=NVDA&amount=1000`.
2. The server fetches `GET /v5/real-world-assets/quotes/latest` from CoinMarketCap, which returns every wrapper, the issuer name, and the aggregate tokenized price in one call.
3. The anchor is `average_tokenized_price`. If CoinMarketCap omits it, the anchor is the median wrapper price.
4. Each wrapper is scored out of 100:
   - Fairness, 40 points: `40 - min(40, abs(premium%) * 10)`.
   - Liquidity, 30 points: log-scaled 24h volume (20) plus log-scaled market cap (10). A missing volume scores 0 and is flagged, not treated as zero dollars in the table.
   - Issuer, 30 points: log-scaled summed 24h volume (16) plus log-scaled summed market cap (10) plus a token-count tiebreak capped at 4. Gram gold quotes within 10 percent of `anchor / 31.1035` are converted to ounces first.
5. A wrapper is excluded from Best when 24h volume is under $10,000 or the quote is older than 15 minutes. A volatile premium (24h range of 2 percentage points or more) is flagged but can still be Best. A single-wrapper asset is shown with no comparison.
6. Dollar value received is `amount * anchor / price`. The headline saving is the fair-value gap between the best eligible wrapper and the highest eligible price.

## CoinMarketCap endpoints used

| Endpoint | Use |
| --- | --- |
| `GET /v5/real-world-assets/quotes/latest` | Wrapper prices, aggregate anchor, volume |
| `GET /v5/real-world-assets/issuers/list` | Issuer token counts; issuer volume in the score is summed from that asset's wrappers |
| `GET /v5/real-world-assets/map` | Catalog size in the stats strip |
| `GET /v5/real-world-assets/info` | Asset description in the detail drawer |
| `GET /v2/cryptocurrency/info` | Chain and platform for each wrapper |
| `GET /v2/cryptocurrency/quotes/latest` | Linked token quote in the drawer |

Market pairs are not used because that endpoint requires Growth or higher. This app stays on the free Startup plan.

## Free API limitations

- Live prices require a CoinMarketCap API key. Without one, the app serves the last cached response, then a recorded fixture, and labels that source.
- Market pairs are unavailable on the Startup plan, so chain and on-chain quotes are resolved through the crypto `info` and `quotes` endpoints via `crypto_id`.
- The issuer list has token counts but no issuer-wide volume, so issuer strength combines the token count with the summed 24h volume and market cap of that issuer's wrappers on the asset.
- Spreads on liquid stocks are often a few cents, so the dollar gap on $1,000 can be small.
- Quotes can be stale while the underlying stock market is closed. Stale rows are flagged and left out of Best.
- Premium history is stored as JSON under `data/snapshots/` after live fetches, at most once per hour per wrapper. Until two points exist, the table reports that history is still collecting.
- Recorded responses used without a key live in `data/fixtures/`. Watchlist, CSV export, and email alerts are not in this version.

## Run locally

Requirements: Node.js 20 or later and npm.

```bash
cp .env.example .env.local
# put your CoinMarketCap key in CMC_API_KEY
npm install
npm test
npm run dev
```

Open `http://localhost:3000/?asset=NVDA&amount=1000`.

The key is read only by server routes. It is never sent to the browser.

## Deploy on Vercel

The app is a standard Next.js project and deploys from this repo without extra build steps.

1. Import the repository in Vercel.
2. Keep the defaults: Framework Preset `Next.js`, Build Command `npm run build`, Output Directory empty.
3. Add the environment variable `CMC_API_KEY` with your CoinMarketCap key. Redeploy after changing it.
4. Without `CMC_API_KEY`, the deployed app still works from cached and fixture data, and labels the source. Set the key for live prices.

Vercel's filesystem is read-only at runtime. The app already handles that: in-memory caching always works, disk caching is best-effort, and premium history falls back to the temporary directory when the local snapshot folder is not writable.

## Project structure

- `app/` — landing page, dashboard, and server API routes.
- `components/` — comparison UI, including the calculator, table, drawer, and score display.
- `lib/` — CoinMarketCap client, comparison logic, scoring, formatting, and snapshots.
- `data/curated-assets.json` — the five supported assets and their aliases.
- `data/fixtures/` — recorded API responses used when no key is configured.
- `scripts/probe-cmc.mjs` — manual CoinMarketCap probe that refreshes fixtures.

## Scripts

- `npm run dev` — start the development server.
- `npm run build` — production build used by Vercel.
- `npm run start` — serve the production build.
- `npm test` — run the scoring tests.

## Disclaimer

WrapWise is a data comparison tool built on CoinMarketCap data. It is not financial advice.
