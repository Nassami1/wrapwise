import curated from "@/data/curated-assets.json";

export type CuratedAsset = {
  symbol: string;
  name: string;
  rwa_id: number | null;
  aliases: string[];
};

export const curatedAssets = curated as CuratedAsset[];

const aliasToSymbol = new Map<string, string>();
for (const asset of curatedAssets) {
  aliasToSymbol.set(asset.symbol, asset.symbol);
  for (const alias of asset.aliases) aliasToSymbol.set(alias.toUpperCase(), asset.symbol);
}

export function normalizeQuery(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{1,10}$/.test(trimmed)) {
    const byId = curatedAssets.find((asset) => String(asset.rwa_id) === trimmed);
    return byId?.symbol ?? trimmed;
  }
  const tokens = trimmed.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    const mapped = aliasToSymbol.get(token);
    if (mapped) return mapped;
  }
  const first = tokens.find((token) => /^[A-Z0-9]{1,12}$/.test(token));
  return first ?? null;
}

export function suggestions(): string[] {
  return curatedAssets.map((asset) => asset.symbol);
}
