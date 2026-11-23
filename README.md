# WrapWise

WrapWise compares tokenized wrappers of the same real-world asset and shows which one is closest to fair value, in dollars.

Built for the Build with CMC: API Hackathon Round 2, Real World Assets track.

site : https://wrapwise.samimi.xyz/

demo : https://youtu.be/wYuodjSTg-k


<img width="2110" height="748" alt="Collage w" src="https://github.com/user-attachments/assets/b5747907-993c-4f45-9b4e-0f3c046a9641" />



The problem: the same stock or metal can trade through several tokenized wrappers at different prices, with different liquidity and different issuers. Checking each wrapper by hand is slow and error-prone. The solution: WrapWise pulls wrapper prices from the CoinMarketCap API, builds one aggregate anchor price, scores every wrapper on fairness, liquidity, and issuer strength, and translates the result into a dollar answer for the amount you enter. It is a comparison tool, not financial advice.

WrapWise uses the free CoinMarketCap Startup plan. That tier is enough for the comparison, with the limits described below.

## What it does

- Search a curated set of assets: NVDA, Gold, SPY, AAPL, and TSLA.
- Compare every tokenized wrapper of the selected asset on one screen.
- See the best eligible wrapper, the cheapest eligible wrapper, the premium or discount against the anchor, and what your dollar amount actually buys.
- Inspect liquidity, issuer strength, chain, quote age, and premium history.
- Open a wrapper on CoinMarketCap from a link built with that token's `slug`. Gold uses six checked URLs. A token with no slug has no link.
- Works with live data when `CMC_API_KEY` is set. Without a key, the server tries a disk cache, then a recorded fixture, and labels the source. A fresh checkout does not include a quotes fixture, so the comparison needs a key.

## How it works

1. The landing page is `/`. The comparison tool is `/dashboard`. An old link such as `/?asset=NVDA&amount=1000` redirects to `/dashboard?asset=NVDA&amount=1000`.
2. The server fetches `GET /v5/real-world-assets/quotes/latest`, which returns every wrapper, the issuer name, and the aggregate tokenized price in one call.
3. The anchor is `average_tokenized_price`. If CoinMarketCap omits it, the anchor is the median wrapper price. Per-gram gold quotes are converted to troy ounces before that premium is scored: a price within 10 percent of `anchor / 31.1035` is multiplied by 31.1035. CGO and VNXAU are also converted when the raw price is under half the anchor.
4. Each wrapper is scored out of 100:
   - Fairness, 40 points: `40 - min(40, abs(premium%) * 10)`.
   - Liquidity, 30 points: log-scaled 24h volume, up to 20, plus log-scaled market cap, up to 10. A missing volume scores 0. The table shows `n/a`, not `$0`. The row is flagged Low liquidity and left out of Best. A real volume of `$0` is shown as `$0` and is also left out, because it is under $10,000.
   - Issuer, 30 points: log-scaled summed 24h volume of that issuer's wrappers on this asset, up to 16, plus log-scaled summed market cap, up to 10, plus a token-count tiebreak of at most 4. The token term applies only when the issuer has more than one token.
5. A wrapper is excluded from Best when 24h volume is under $10,000 or the quote is older than 15 minutes. Volatile means the premium range across stored points from the last 24 hours, plus the current premium, is 2 percentage points or more. That flag does not exclude the wrapper. A single-wrapper asset is shown with no Best pick.
6. Fair value received is `amount * anchor / price`. The card says "Saves $X vs. worst eligible wrapper on $Y". That dollar amount is the fair value you receive at the best eligible price, minus the fair value you receive at the highest eligible price.

## CoinMarketCap endpoints used

| Endpoint | Use |
| --- | --- |
| `GET /v5/real-world-assets/quotes/latest` | Wrapper prices, aggregate anchor, volume, issuer, `crypto_id` |
| `GET /v5/real-world-assets/issuers/list` | Issuer token counts. Issuer volume in the score is the sum of that issuer's wrappers on the current asset |
| `GET /v5/real-world-assets/map` | Catalog size on the landing page |
| `GET /v5/real-world-assets/info` | Asset description in the detail drawer |
| `GET /v2/cryptocurrency/info` | Chain, logo, and slug for each wrapper |
| `GET /v2/cryptocurrency/quotes/latest` | Linked token quote in the drawer |

The app does not call `GET /v5/real-world-assets/assets/list` or `GET /v5/real-world-assets/issuers`. Market pairs are not used because that endpoint requires Growth or higher.

### Sample response

Trimmed from a recorded `quotes/latest` response. Not a live quote. The quotes file is not in `data/fixtures/` in this checkout. `data/fixtures/map.json` is a real recorded map response and is the catalog sample below.

```json
{
  "symbol": "NVDA",
  "average_tokenized_price": 144.2706300785253,
  "tokens": [
    {
      "symbol": "NVDAX",
      "name": "NVIDIA tokenized stock (xStock)",
      "price": 144.44370477912562,
      "volume_24h": 69178640.24945682,
      "issuer_name": "Backed Assets",
      "crypto_id": 36992
    }
  ]
}
```

```json
{
  "data": {
    "total_size": 7811
  },
  "status": {
    "error_code": "0",
    "credit_count": 0
  }
}
```

## What CMC API Made Possible / Where It Got in the Way

One `quotes/latest` call returns every wrapper of an asset, the aggregate tokenized price, volume, issuer, and `crypto_id`, which is enough to score the set and link each token. The same plan does not include market pairs, so chain, logo, and the public page slug come from `cryptocurrency/info` instead. Several gold wrappers are quoted per gram, so those prices have to be scaled to ounces before a premium means anything. `issuers/list` has a token count and no issuer-wide volume, so issuer strength uses the sum of that issuer's wrappers on the asset you are viewing. Stock quotes go stale while the underlying market is closed, and premium history does not exist until this app has stored its own snapshots.

## Free API limitations

- Live prices require a CoinMarketCap API key. Without one, the app serves the last disk cache, then a recorded fixture, and labels that source. This checkout's fixtures are `data/fixtures/map.json` and `data/fixtures/info.json`. There is no quotes fixture, so a comparison without a key stops at "No recorded fixture".
- Market pairs are unavailable on the Startup plan.
- The issuer list has token counts but no issuer-wide volume.
- Spreads on liquid stocks are often a few cents, so the dollar gap on $1,000 can be small.
- Quotes can be stale while the underlying stock market is closed. Stale rows are flagged and left out of Best.
- Premium history is written under `data/snapshots/` after a live quote, at most once an hour per wrapper, and points older than 8 days are dropped. The chart uses those points from the last 24 hours plus the current premium. With fewer than two points, the cell shows a flat line and "History collecting". It does not invent points.
- Watchlist, CSV export, and email alerts are not in this version.

## Run locally

Requirements: Node.js 20 or later and npm. `package.json` sets `"node": ">=20"`.

```bash
cp .env.example .env.local
# put your CoinMarketCap key in CMC_API_KEY
npm install
npm test
npm run dev
```

Open `http://localhost:3000/dashboard?asset=NVDA&amount=1000`.

`.env.example` contains only `CMC_API_KEY=` and no key. The key is read only by server routes. It is never sent to the browser.




## Scripts

- `npm run dev`: start the development server.
- `npm run build`: production build used by Vercel.
- `npm run start`: serve the production build.
- `npm test`: run the scoring tests (`lib/scoring.test.mts`).

## Disclaimer

WrapWise is a data comparison tool built on CoinMarketCap data. It is not financial advice.
