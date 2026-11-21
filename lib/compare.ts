import fs from "fs";
import path from "path";
import { readCache, readDisk, writeCache, writeDisk } from "./cache";
import { cmcGet, hasCmcKey } from "./cmc";
import { cmcUrlFor } from "./cmc-url";
import { curatedAssets, normalizeQuery, suggestions } from "./curated";
import { appendSnapshots, readSnapshots } from "./snapshots";
import { anchorPrice, historySeries, normalizeToOunce, scoreWrapper } from "./scoring";
import type { Comparison, CryptoQuote, Envelope, Source, WrapperView } from "./types";

type Token = {
  symbol?: string;
  name?: string;
  price?: number;
  crypto_id?: number;
  issuer_id?: string | null;
  issuer_name?: string | null;
  market_cap?: number | null;
  volume_24h?: number | null;
};

type Asset = {
  name?: string;
  symbol?: string;
  slug?: string;
  rwa_id?: number;
  asset_type?: string;
  average_tokenized_price?: number | null;
  last_updated?: string | null;
  tokens?: Token[];
};

const QUOTES_TTL = 90_000;
const DAY = 24 * 60 * 60 * 1000;

function fixture(name: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "fixtures", name), "utf8"));
  } catch {
    return null;
  }
}

function assetsFrom(body: Record<string, unknown> | null): Asset[] {
  const data = body?.data as { rwa_assets?: Asset[] } | undefined;
  return data?.rwa_assets ?? [];
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function issuerCounts(body: Record<string, unknown> | null): Map<string, number> {
  const issuers = (body?.data as { issuers?: { issuer_id?: string; num_tokens?: number }[] } | undefined)?.issuers ?? [];
  const map = new Map<string, number>();
  for (const issuer of issuers) {
    if (issuer.issuer_id && typeof issuer.num_tokens === "number") map.set(issuer.issuer_id, issuer.num_tokens);
  }
  return map;
}

function issuerTotal(body: Record<string, unknown> | null): number | null {
  const total = (body?.data as { total_size?: number } | undefined)?.total_size;
  return typeof total === "number" ? total : null;
}

function mapTotal(body: Record<string, unknown> | null): number | null {
  const total = (body?.data as { total_size?: number } | undefined)?.total_size;
  return typeof total === "number" ? total : null;
}

function infoFields(body: Record<string, unknown> | null): { logos: Map<number, string>; slugs: Map<number, string> } {
  const logos = new Map<number, string>();
  const slugs = new Map<number, string>();
  const data = (body?.data ?? null) as Record<string, unknown> | null;
  if (!data) return { logos, slugs };
  for (const value of Object.values(data)) {
    const entries = Array.isArray(value) ? value : [value];
    for (const entry of entries) {
      const row = entry as { id?: number; logo?: string; slug?: string };
      if (!row.id) continue;
      if (row.logo) logos.set(row.id, row.logo);
      if (row.slug) slugs.set(row.id, row.slug);
    }
  }
  return { logos, slugs };
}

function presetLogos(): Record<string, string | null> {
  const logos: Record<string, string | null> = {};
  for (const asset of curatedAssets) {
    const known = infoFields(readDisk<Record<string, unknown>>(`crypto-info-${asset.symbol}.json`)).logos;
    const quotes = readDisk<Record<string, unknown>>(`quotes-${asset.symbol}.json`);
    const tokens =
      assetsFrom(quotes).find((item) => item.symbol?.toUpperCase() === asset.symbol)?.tokens ?? [];
    const top = [...tokens].sort((a, b) => (num(b.volume_24h) ?? 0) - (num(a.volume_24h) ?? 0))[0];
    logos[asset.symbol] = (top?.crypto_id != null ? known.get(top.crypto_id) : null) ?? known.values().next().value ?? null;
  }
  return logos;
}

function chainsFrom(body: Record<string, unknown> | null): Map<number, string> {
  const map = new Map<number, string>();
  const data = (body?.data ?? null) as Record<string, unknown> | null;
  if (!data) return map;
  for (const value of Object.values(data)) {
    const entries = Array.isArray(value) ? value : [value];
    for (const entry of entries) {
      const row = entry as {
        id?: number;
        platform?: { name?: string };
        contract_address?: { platform?: { name?: string } }[];
      };
      const name = row.platform?.name || row.contract_address?.[0]?.platform?.name;
      if (row.id && name) map.set(row.id, name);
    }
  }
  return map;
}

async function loadJson(
  cacheKey: string,
  ttl: number,
  diskName: string,
  fixtureName: string,
  load: () => Promise<Record<string, unknown>>,
  refresh: boolean,
): Promise<{ body: Record<string, unknown>; source: Source } | null> {
  if (!refresh) {
    const mem = readCache<Record<string, unknown>>(cacheKey);
    if (mem) return { body: mem, source: "cache" };
  }
  if (hasCmcKey()) {
    try {
      const body = await load();
      writeCache(cacheKey, body, ttl);
      writeDisk(diskName, body);
      return { body, source: "live" };
    } catch (error) {
      console.info(`[cmc] fallback ${cacheKey}: ${(error as Error).message}`);
    }
  }
  const disk = readDisk<Record<string, unknown>>(diskName);
  if (disk) return { body: disk, source: "cache" };
  const recorded = fixture(fixtureName);
  if (recorded) return { body: recorded, source: "fixture" };
  return null;
}

function empty(notice: string, source: Source, error?: string): Envelope<Comparison> {
  return {
    data: {
      asset: null,
      wrappers: [],
      single: false,
      suggestions: suggestions(),
      presetLogos: {},
      stats: { assetsTracked: null, issuersCovered: null, wrappersCompared: 0 },
      endpoints: [],
      notice,
    },
    source,
    fetchedAt: new Date().toISOString(),
    error,
  };
}

export async function getComparison(raw: string, refresh = false): Promise<Envelope<Comparison>> {
  const symbol = normalizeQuery(raw);
  if (!symbol) {
    return empty("Enter a symbol such as NVDA, GOLD, SPY, AAPL, or TSLA.", "fixture", "Unknown symbol");
  }
  const byId = /^\d+$/.test(symbol);
  const quotes = await loadJson(
    `quotes:${symbol}`,
    QUOTES_TTL,
    `quotes-${symbol}.json`,
    "quotes-latest.json",
    () =>
      cmcGet("/v5/real-world-assets/quotes/latest", {
        ...(byId ? { rwa_id: symbol } : { symbol }),
        convert: "USD",
      }),
    refresh,
  );
  if (!quotes) return empty(`No CMC data for ${symbol}.`, "fixture", "No data");

  let asset =
    assetsFrom(quotes.body).find((item) =>
      byId ? String(item.rwa_id) === symbol : item.symbol?.toUpperCase() === symbol,
    ) ?? null;
  if (!asset && quotes.source === "fixture") {
    return empty(
      `No recorded fixture for ${symbol}. Add CMC_API_KEY to fetch it live.`,
      "fixture",
      "No fixture",
    );
  }
  if (!asset) return empty(`No tokenized asset matched ${symbol}.`, quotes.source, "Not found");

  const issuers = await loadJson(
    "issuers",
    DAY,
    "issuers.json",
    "issuers-list.json",
    () => cmcGet("/v5/real-world-assets/issuers/list", { start: "1", limit: "250" }),
    false,
  );
  const map = await loadJson(
    "map-total",
    DAY,
    "map.json",
    "map.json",
    () => cmcGet("/v5/real-world-assets/map", { start: "1", limit: "1" }),
    false,
  );

  const tokens = asset.tokens ?? [];
  const ids = tokens.map((token) => token.crypto_id).filter((id): id is number => typeof id === "number");
  const info = ids.length
    ? await loadJson(
        `crypto-info:${ids.slice().sort((a, b) => a - b).join(",")}`,
        DAY,
        `crypto-info-${symbol}.json`,
        "crypto-info.json",
        () => cmcGet("/v2/cryptocurrency/info", { id: ids.join(",") }),
        false,
      )
    : null;

  const counts = issuerCounts(issuers?.body ?? null);
  const chains = chainsFrom(info?.body ?? null);
  const { logos, slugs } = infoFields(info?.body ?? null);
  const assetSymbol = asset.symbol ?? symbol;
  const prices = tokens.map((token) => num(token.price)).filter((price): price is number => price != null);
  const listedAnchor = anchorPrice(asset.average_tokenized_price, []);
  const anchor =
    listedAnchor ??
    anchorPrice(
      null,
      prices.map((price) => normalizeToOunce(price, anchorPrice(null, prices) ?? price, "").price),
    );
  if (anchor == null) {
    return empty(`No tokenized wrappers found for ${asset.symbol ?? symbol}.`, quotes.source);
  }

  const history = readSnapshots(asset.symbol ?? symbol);
  const now = Date.now();
  const checkStale = quotes.source !== "fixture";
  const quoteUpdated = asset.last_updated ?? null;

  const issuerVolume = new Map<string, number>();
  const issuerCap = new Map<string, number>();
  for (const token of tokens) {
    if (!token.issuer_id) continue;
    const volume = num(token.volume_24h);
    const cap = num(token.market_cap);
    if (volume != null) issuerVolume.set(token.issuer_id, (issuerVolume.get(token.issuer_id) ?? 0) + volume);
    if (cap != null) issuerCap.set(token.issuer_id, (issuerCap.get(token.issuer_id) ?? 0) + cap);
  }

  const wrappers: WrapperView[] = tokens.flatMap((token): WrapperView[] => {
    const rawPrice = num(token.price);
    const cryptoId = token.crypto_id;
    if (cryptoId == null) return [];
    const unit = rawPrice == null ? null : normalizeToOunce(rawPrice, anchor, token.symbol ?? "");
    const price = unit?.price ?? null;
    const issuerTokens = token.issuer_id ? counts.get(token.issuer_id) ?? null : null;
    const summedVolume = token.issuer_id ? issuerVolume.get(token.issuer_id) ?? null : null;
    const summedCap = token.issuer_id ? issuerCap.get(token.issuer_id) ?? null : null;
    if (price == null) {
      return [{
        symbol: token.symbol ?? String(cryptoId),
        name: token.name ?? token.symbol ?? "Wrapper",
        cryptoId,
        issuerId: token.issuer_id ?? null,
        issuerName: token.issuer_name || "Unknown issuer",
        issuerTokens,
        chain: chains.get(cryptoId) ?? null,
        logo: logos.get(cryptoId) ?? null,
        cmcUrl: cmcUrlFor(assetSymbol, token.symbol ?? "", slugs.get(cryptoId)),
        price: null,
        normalized: false,
        anchor,
        premiumPct: null,
        volume24h: num(token.volume_24h),
        marketCap: num(token.market_cap),
        quoteUpdated,
        fairness: 0,
        liquidity: 0,
        issuer: 0,
        total: 0,
        flags: ["Low liquidity"],
        excluded: true,
        stability: null,
        premiumRange: null,
        history: [],
      }];
    }
    const past = history
      .filter((row) => row.token_id === cryptoId)
      .filter((row) => now - Date.parse(row.timestamp) <= DAY)
      .map((row) => row.premium_pct);
    const scored = scoreWrapper({
      price,
      anchor,
      volume24h: num(token.volume_24h),
      marketCap: num(token.market_cap),
      issuerTokens,
      issuerVolume: summedVolume,
      issuerMarketCap: summedCap,
      quoteUpdated,
      now,
      checkStale,
      historyPremiums: past,
    });
    return [{
      symbol: token.symbol ?? String(cryptoId),
      name: token.name ?? token.symbol ?? "Wrapper",
      cryptoId,
      issuerId: token.issuer_id ?? null,
      issuerName: token.issuer_name || "Unknown issuer",
      issuerTokens,
      chain: chains.get(cryptoId) ?? null,
      logo: logos.get(cryptoId) ?? null,
      cmcUrl: cmcUrlFor(assetSymbol, token.symbol ?? "", slugs.get(cryptoId)),
      price,
      normalized: unit?.normalized ?? false,
      anchor,
      volume24h: num(token.volume_24h),
      marketCap: num(token.market_cap),
      quoteUpdated,
      history: historySeries(past, scored.premiumPct),
      ...scored,
    }];
  });

  wrappers.sort((a, b) => {
    const incomplete = (row: { price: number | null; volume24h: number | null }) =>
      row.price == null || row.volume24h == null;
    const gap = Number(incomplete(a)) - Number(incomplete(b));
    return gap || b.total - a.total;
  });

  if (quotes.source === "live") {
    appendSnapshots(
      asset.symbol ?? symbol,
      wrappers.flatMap((wrapper) =>
        wrapper.premiumPct == null || wrapper.price == null
          ? []
          : [{
              rwa_id: asset.rwa_id ?? 0,
              token_id: wrapper.cryptoId,
              price: wrapper.price,
              premium_pct: wrapper.premiumPct,
              volume_24h: wrapper.volume24h,
              timestamp: new Date().toISOString(),
            }],
      ),
    );
  }

  const stale = checkStale && (!quoteUpdated || now - Date.parse(quoteUpdated) > 15 * 60 * 1000);
  const endpoints = [
    "GET /v5/real-world-assets/quotes/latest",
    issuers ? "GET /v5/real-world-assets/issuers/list" : "",
    info && info.source !== "fixture" ? "GET /v2/cryptocurrency/info" : "",
    map ? "GET /v5/real-world-assets/map" : "",
  ].filter(Boolean);

  let notice: string | null = null;
  if (!wrappers.length) {
    notice = `No tokenized wrappers found for ${asset.symbol ?? symbol}.`;
  } else if (quotes.source === "fixture") {
    notice = "Recorded fixture, not a live quote. Set CMC_API_KEY for live prices.";
  } else if (quotes.source === "cache" && refresh) {
    notice = "Cached. Live update failed, retrying";
  }

  return {
    data: {
      asset: {
        name: asset.name ?? symbol,
        symbol: asset.symbol ?? symbol,
        rwaId: asset.rwa_id ?? 0,
        assetType: asset.asset_type ?? "asset",
        slug: asset.slug ?? "",
        anchor,
        lastUpdated: quoteUpdated,
        marketClosedNote:
          stale && asset.asset_type === "stock"
            ? "Underlying market closed. Tokenized price may be stale"
            : null,
      },
      wrappers,
      presetLogos: presetLogos(),
      single: wrappers.length === 1,
      suggestions: suggestions(),
      stats: {
        assetsTracked: mapTotal(map?.body ?? null),
        issuersCovered: issuerTotal(issuers?.body ?? null),
        wrappersCompared: wrappers.length,
      },
      endpoints,
      notice,
    },
    source: quotes.source,
    fetchedAt: new Date().toISOString(),
  };
}

function quoteEntry(body: Record<string, unknown>, id: string): Record<string, unknown> | null {
  const data = body.data as Record<string, unknown> | undefined;
  const value = data?.[id];
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return (value as Record<string, unknown>) ?? null;
}

export async function getMapEnvelope(): Promise<Envelope<unknown>> {
  const map = await loadJson(
    "map-total",
    DAY,
    "map.json",
    "map.json",
    () => cmcGet("/v5/real-world-assets/map", { start: "1", limit: "1" }),
    false,
  );
  return {
    data: (map?.body.data as unknown) ?? null,
    source: map?.source ?? "fixture",
    fetchedAt: new Date().toISOString(),
    error: map ? undefined : "No map",
  };
}

export async function getIssuersEnvelope(): Promise<Envelope<unknown>> {
  const issuers = await loadJson(
    "issuers",
    DAY,
    "issuers.json",
    "issuers-list.json",
    () => cmcGet("/v5/real-world-assets/issuers/list", { start: "1", limit: "250" }),
    false,
  );
  return {
    data: (issuers?.body.data as unknown) ?? null,
    source: issuers?.source ?? "fixture",
    fetchedAt: new Date().toISOString(),
    error: issuers ? undefined : "No issuers",
  };
}

export async function getInfoEnvelope(raw: string): Promise<Envelope<unknown>> {
  const symbol = normalizeQuery(raw);
  if (!symbol || /^\d+$/.test(symbol)) {
    return { data: null, source: "fixture", fetchedAt: new Date().toISOString(), error: "Unknown symbol" };
  }
  const info = await loadJson(
    `info:${symbol}`,
    DAY,
    `info-${symbol}.json`,
    "info.json",
    () => cmcGet("/v5/real-world-assets/info", { symbol }),
    false,
  );
  const assets = (info?.body.data as { rwa_assets?: { symbol?: string }[] } | undefined)?.rwa_assets ?? [];
  const match = assets.find((asset) => asset.symbol?.toUpperCase() === symbol) ?? null;
  if (!match) {
    return {
      data: null,
      source: info?.source ?? "fixture",
      fetchedAt: new Date().toISOString(),
      error: `No recorded info for ${symbol}.`,
    };
  }
  return { data: match, source: info?.source ?? "fixture", fetchedAt: new Date().toISOString() };
}

export async function getCryptoQuote(id: string): Promise<Envelope<CryptoQuote | null>> {
  if (!/^\d{1,10}$/.test(id)) {
    return { data: null, source: "fixture", fetchedAt: new Date().toISOString(), error: "Bad crypto id" };
  }
  const loaded = await loadJson(
    `crypto-quote:${id}`,
    QUOTES_TTL,
    `crypto-quote-${id}.json`,
    "crypto-quote-missing.json",
    () => cmcGet("/v2/cryptocurrency/quotes/latest", { id, convert: "USD" }),
    false,
  );
  if (!loaded || loaded.source === "fixture") {
    return {
      data: null,
      source: loaded?.source ?? "fixture",
      fetchedAt: new Date().toISOString(),
      error: "No crypto quote. The RWA price above is still from quotes/latest.",
    };
  }
  const entry = quoteEntry(loaded.body, id);
  const usd = (entry?.quote as { USD?: Record<string, unknown> } | undefined)?.USD;
  return {
    data: {
      id: Number(id),
      name: String(entry?.name ?? ""),
      symbol: String(entry?.symbol ?? ""),
      slug: typeof entry?.slug === "string" ? entry.slug : null,
      price: num(usd?.price),
      marketCap: num(usd?.market_cap),
      volume24h: num(usd?.volume_24h),
      percentChange24h: num(usd?.percent_change_24h),
      lastUpdated: typeof usd?.last_updated === "string" ? usd.last_updated : null,
    },
    source: loaded.source,
    fetchedAt: new Date().toISOString(),
  };
}
