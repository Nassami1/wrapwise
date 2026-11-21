export function usd(n: number | null, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "n/a";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function compactUsd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function signedUsd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "n/a";
  const abs = usd(Math.abs(n));
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

export function pct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "n/a";
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function utcStamp(iso: string | null): string {
  if (!iso) return "n/a";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "n/a";
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
