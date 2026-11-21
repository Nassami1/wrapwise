/** Verified live on 2026-11-20. Gold uses this map only. */
const GOLD_CMC_URLS: Record<string, string> = {
  XAUt: "https://coinmarketcap.com/currencies/tether-gold/",
  PAXG: "https://coinmarketcap.com/currencies/pax-gold/",
  XAUT0: "https://coinmarketcap.com/currencies/tether-gold-tokens/",
  CGO: "https://coinmarketcap.com/currencies/comtech-gold/",
  XAUM: "https://coinmarketcap.com/currencies/matrixdock-gold/",
  VNXAU: "https://coinmarketcap.com/currencies/vnx-gold/",
};

/** Gold: the verified map. Other assets: a CMC info slug, or nothing. */
export function cmcUrlFor(assetSymbol: string, tokenSymbol: string, slug: string | null | undefined): string | null {
  if (assetSymbol.toUpperCase() === "GOLD") return GOLD_CMC_URLS[tokenSymbol] ?? null;
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return `https://coinmarketcap.com/currencies/${slug}/`;
}
