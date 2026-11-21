import type { Stability } from "./types";

export function anchorPrice(aggregate: number | null | undefined, prices: number[]): number | null {
  if (aggregate != null && Number.isFinite(aggregate) && aggregate > 0) return aggregate;
  const ok = prices.filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
  if (!ok.length) return null;
  const mid = Math.floor(ok.length / 2);
  return ok.length % 2 ? ok[mid] : (ok[mid - 1] + ok[mid]) / 2;
}

export function premiumPct(price: number, anchor: number): number | null {
  if (!Number.isFinite(price) || !Number.isFinite(anchor) || anchor === 0) return null;
  return ((price - anchor) / anchor) * 100;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 40 at 0% premium, 30 at 1%, 0 at 4% or more. */
export function fairnessRaw(premium: number | null): number {
  if (premium == null || !Number.isFinite(premium)) return 0;
  return 40 - Math.min(40, Math.abs(premium) * 10);
}

/** Log-scaled 24h volume (20) + market cap (10). Null volume scores 0. */
export function liquidityRaw(volume24h: number | null, marketCap: number | null): number {
  if (volume24h == null || !Number.isFinite(volume24h)) return 0;
  const vol = clamp((Math.log10(Math.max(volume24h, 1)) / 8) * 20, 0, 20);
  const cap =
    marketCap != null && Number.isFinite(marketCap) && marketCap > 0
      ? clamp((Math.log10(marketCap) / 9) * 10, 0, 10)
      : 0;
  return vol + cap;
}

const TROY_OZ_GRAMS = 31.1035;
const GRAM_SYMBOLS = new Set(["CGO", "VNXAU"]);

/** Per-gram quotes sit near anchor/31.1035. Known symbols are a fallback only. */
export function normalizeToOunce(price: number, anchor: number, symbol: string): { price: number; normalized: boolean } {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(anchor) || anchor <= 0) {
    return { price, normalized: false };
  }
  const gram = anchor / TROY_OZ_GRAMS;
  const ratio = price / gram;
  const knownGram = GRAM_SYMBOLS.has(symbol.toUpperCase()) && price < anchor * 0.5;
  if ((ratio >= 0.9 && ratio <= 1.1) || knownGram) {
    return { price: price * TROY_OZ_GRAMS, normalized: true };
  }
  return { price, normalized: false };
}

// Volume and market cap are the size signal. Token count is at most 4 points so a long token list cannot outrank a large issuer.
export function issuerRaw(volume24h: number | null, marketCap: number | null, numTokens: number | null): number {
  const vol =
    volume24h != null && volume24h > 0 ? clamp((Math.log10(volume24h) / 8) * 16, 0, 16) : 0;
  const cap = marketCap != null && marketCap > 0 ? clamp((Math.log10(marketCap) / 9) * 10, 0, 10) : 0;
  const tokens =
    numTokens != null && numTokens > 1 ? clamp((Math.log10(numTokens) / Math.log10(200)) * 4, 0, 4) : 0;
  return vol + cap + tokens;
}

export function stabilityOf(premiums: number[]): Stability | null {
  if (premiums.length < 2) return null;
  const range = Math.max(...premiums) - Math.min(...premiums);
  if (range < 1) return "Stable";
  if (range >= 2) return "Volatile";
  return "Moderate";
}

/** Stored premiums, plus the live premium when we have one. Does not invent points. */
export function historySeries(stored: number[], current: number | null): number[] {
  if (current == null || !Number.isFinite(current)) return stored;
  return [...stored, current];
}

export function premiumRange(premiums: number[]): { min: number; max: number; median: number } | null {
  if (!premiums.length) return null;
  const sorted = [...premiums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { min: sorted[0], max: sorted[sorted.length - 1], median };
}

export function confidenceFlags(input: {
  volume24h: number | null;
  quoteUpdated: string | null;
  now: number;
  checkStale: boolean;
  stability: Stability | null;
}): { flags: string[]; excluded: boolean } {
  const flags: string[] = [];
  if (input.volume24h == null || input.volume24h < 10_000) flags.push("Low liquidity");
  if (input.checkStale) {
    const t = input.quoteUpdated ? Date.parse(input.quoteUpdated) : NaN;
    if (!Number.isFinite(t) || input.now - t > 15 * 60 * 1000) flags.push("Stale");
  }
  if (input.stability === "Volatile") flags.push("Volatile premium");
  const excluded = flags.includes("Low liquidity") || flags.includes("Stale");
  return { flags, excluded };
}

export type ScoredParts = {
  premiumPct: number | null;
  fairness: number;
  liquidity: number;
  issuer: number;
  total: number;
  flags: string[];
  excluded: boolean;
  stability: Stability | null;
  premiumRange: { min: number; max: number; median: number } | null;
};

export function scoreWrapper(input: {
  price: number;
  anchor: number;
  volume24h: number | null;
  marketCap: number | null;
  issuerTokens: number | null;
  issuerVolume: number | null;
  issuerMarketCap: number | null;
  quoteUpdated: string | null;
  now: number;
  checkStale: boolean;
  historyPremiums: number[];
}): ScoredParts {
  const premium = premiumPct(input.price, input.anchor);
  const history = premium == null ? input.historyPremiums : [...input.historyPremiums, premium];
  const stability = stabilityOf(history);
  const confidence = confidenceFlags({
    volume24h: input.volume24h,
    quoteUpdated: input.quoteUpdated,
    now: input.now,
    checkStale: input.checkStale,
    stability,
  });
  const fairness = Math.round(fairnessRaw(premium));
  const liquidity = Math.round(liquidityRaw(input.volume24h, input.marketCap));
  const issuer = Math.round(issuerRaw(input.issuerVolume, input.issuerMarketCap, input.issuerTokens));
  return {
    premiumPct: premium,
    fairness,
    liquidity,
    issuer,
    total: fairness + liquidity + issuer,
    flags: confidence.flags,
    excluded: confidence.excluded,
    stability,
    premiumRange: premiumRange(history),
  };
}

export function fairValueReceived(amountUsd: number, price: number | null, anchor: number): number | null {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || price == null) return null;
  if (!Number.isFinite(price) || price <= 0 || !anchor) return null;
  return amountUsd * (anchor / price);
}

/** Positive means this wrapper returns less fair value than the reference price. */
export function extraCostVs(amountUsd: number, price: number | null, referencePrice: number | null, anchor: number): number | null {
  const mine = fairValueReceived(amountUsd, price, anchor);
  const ref = fairValueReceived(amountUsd, referencePrice, anchor);
  if (mine == null || ref == null) return null;
  return ref - mine;
}

export function eligible<T extends { excluded: boolean }>(rows: T[]): T[] {
  return rows.filter((row) => !row.excluded);
}

export function pickBest<T extends { excluded: boolean; total: number }>(rows: T[]): T | null {
  if (rows.length < 2) return null;
  const ok = eligible(rows);
  if (!ok.length) return null;
  return ok.reduce((best, row) => (row.total > best.total ? row : best));
}

export function pickCheapest<T extends { excluded: boolean; price: number | null }>(rows: T[]): T | null {
  const ok = eligible(rows).filter((row) => row.price != null && row.price > 0);
  if (!ok.length) return null;
  return ok.reduce((cheap, row) => ((row.price ?? Infinity) < (cheap.price ?? Infinity) ? row : cheap));
}

export function pickWorstPrice<T extends { excluded: boolean; price: number | null }>(rows: T[]): T | null {
  if (rows.length < 2) return null;
  const ok = eligible(rows).filter((row) => row.price != null);
  if (ok.length < 2) return null;
  return ok.reduce((worst, row) => ((row.price ?? 0) > (worst.price ?? 0) ? row : worst));
}
