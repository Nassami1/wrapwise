const BASE = "https://pro-api.coinmarketcap.com";

export function hasCmcKey(): boolean {
  return Boolean(process.env.CMC_API_KEY);
}

export async function cmcGet(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const key = process.env.CMC_API_KEY;
  if (!key) throw new Error("NO_KEY");
  const url = new URL(BASE + path);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const res = await fetch(url, {
    headers: { "X-CMC_PRO_API_KEY": key, Accept: "application/json" },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const status = body?.status as { error_code?: number; error_message?: string; credit_count?: number } | undefined;
  const code = Number(status?.error_code ?? 0);
  if (!res.ok || code !== 0) {
    throw new Error(status?.error_message || `CMC ${res.status}`);
  }
  if (!body) throw new Error("CMC empty response");
  console.info(`[cmc] ${path} credits=${status?.credit_count ?? "?"}`);
  return body;
}
