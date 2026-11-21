export type Source = "live" | "cache" | "fixture";

export type Stability = "Stable" | "Moderate" | "Volatile";

export type WrapperView = {
  symbol: string;
  name: string;
  cryptoId: number;
  issuerId: string | null;
  issuerName: string;
  issuerTokens: number | null;
  chain: string | null;
  logo: string | null;
  cmcUrl: string | null;
  price: number | null;
  normalized: boolean;
  anchor: number;
  premiumPct: number | null;
  volume24h: number | null;
  marketCap: number | null;
  quoteUpdated: string | null;
  fairness: number;
  liquidity: number;
  issuer: number;
  total: number;
  flags: string[];
  excluded: boolean;
  stability: Stability | null;
  premiumRange: { min: number; max: number; median: number } | null;
  history: number[];
};

export type Comparison = {
  asset: {
    name: string;
    symbol: string;
    rwaId: number;
    assetType: string;
    slug: string;
    anchor: number;
    lastUpdated: string | null;
    marketClosedNote: string | null;
  } | null;
  wrappers: WrapperView[];
  presetLogos: Record<string, string | null>;
  single: boolean;
  suggestions: string[];
  stats: {
    assetsTracked: number | null;
    issuersCovered: number | null;
    wrappersCompared: number;
  };
  endpoints: string[];
  notice: string | null;
};

export type Envelope<T> = {
  data: T;
  source: Source;
  fetchedAt: string;
  error?: string;
};

export type CryptoQuote = {
  id: number;
  name: string;
  symbol: string;
  slug: string | null;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  percentChange24h: number | null;
  lastUpdated: string | null;
};
