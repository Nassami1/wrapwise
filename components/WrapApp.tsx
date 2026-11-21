"use client";

import { pickBest } from "@/lib/scoring";
import type { Comparison, Envelope, WrapperView } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { curatedAssets } from "@/lib/curated";
import { AmountCalculator } from "./AmountCalculator";
import { BestWrapperCard } from "./BestWrapperCard";
import { Filters } from "./Filters";
import { Nav } from "./Nav";
import { TokenDetailDrawer } from "./TokenDetailDrawer";
import { TokenLogo } from "./TokenLogo";
import { WrapperTable } from "./WrapperTable";

export function WrapApp({ initialAsset, initialAmount }: { initialAsset?: string; initialAmount?: string }) {
  const [draft, setDraft] = useState(initialAsset || "GOLD");
  const [asset, setAsset] = useState(initialAsset || "GOLD");
  const [amount, setAmount] = useState(Number(initialAmount) || 1000);
  const [env, setEnv] = useState<Envelope<Comparison> | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [chain, setChain] = useState("");
  const [issuer, setIssuer] = useState("");
  const [hideIlliquid, setHideIlliquid] = useState(true);
  const [hideStale, setHideStale] = useState(false);
  const [open, setOpen] = useState<WrapperView | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ asset, amount: String(amount || 0) });
    window.history.replaceState(null, "", `/dashboard?${params}`);
  }, [asset, amount]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    const refresh = nonce > 0 ? "&refresh=1" : "";
    fetch(`/api/rwa/quotes?symbol=${encodeURIComponent(asset)}${refresh}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancel) setEnv(body);
      })
      .catch(() => {
        if (!cancel) setEnv(null);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [asset, nonce]);

  const data = env?.data;
  const wrappers = data?.wrappers ?? [];
  const chains = useMemo(
    () => [...new Set(wrappers.map((row) => row.chain).filter((item): item is string => Boolean(item)))],
    [wrappers],
  );
  const issuers = useMemo(() => [...new Set(wrappers.map((row) => row.issuerName))], [wrappers]);
  const visible = wrappers.filter((row) => {
    if (chain && row.chain !== chain) return false;
    if (issuer && row.issuerName !== issuer) return false;
    const illiquid = row.flags.includes("Low liquidity") || row.volume24h == null || row.volume24h < 10_000;
    if (hideIlliquid && illiquid) return false;
    if (hideStale && row.flags.includes("Stale")) return false;
    return true;
  });
  const best = pickBest(visible);

  function search(value: string) {
    setDraft(value);
    setAsset(value);
    setChain("");
    setIssuer("");
    setOpen(null);
  }

  return (
    <>
      <Nav />
      <main>
        <section className="mx-auto max-w-[1200px] px-4 py-8">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              search(draft);
            }}
          >
            <input
              aria-label="Asset"
              className="w-full max-w-sm rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="NVDA, Gold / XAU, SPY"
            />
            <button type="submit" className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-page">
              Compare
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {curatedAssets.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => search(item.symbol)}
                className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-1 text-sm text-muted hover:border-accent hover:text-ink"
              >
                <TokenLogo src={data?.presetLogos?.[item.symbol] ?? null} symbol={item.symbol} size={18} />
                {item.symbol === "GOLD" ? "Gold" : item.symbol}
              </button>
            ))}
          </div>
          <AmountCalculator amount={amount} onChange={setAmount} />
          <div className="mt-6">
            {loading && !data ? <p className="text-muted">Loading CMC quotes…</p> : null}
            {!loading && !data ? <p className="text-muted">Could not load quotes.</p> : null}
            {data?.notice ? (
              <p className="mb-3 text-sm text-muted">
                {data.notice}{" "}
                <button type="button" className="text-accent" onClick={() => setNonce((n) => n + 1)}>
                  Retry
                </button>
              </p>
            ) : null}
            {env?.error && !wrappers.length ? (
              <div className="rounded-2xl border border-line bg-card p-5">
                <p className="text-ink">{data?.notice || env.error}</p>
                <p className="mt-3 text-sm text-muted">Try a curated asset:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(data?.suggestions ?? []).map((symbol) => (
                    <button key={symbol} type="button" className="rounded-xl border border-line px-3 py-1 text-sm text-accent" onClick={() => search(symbol)}>
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {data?.asset && !wrappers.length ? <p className="text-ink">No tokenized wrappers found for this asset.</p> : null}
            {data?.asset?.marketClosedNote ? <p className="mb-3 text-sm text-[#F59E0B]">{data.asset.marketClosedNote}</p> : null}
            {wrappers.length ? (
              <BestWrapperCard rows={visible} amount={amount} single={data?.single ?? false} />
            ) : null}
            {amount <= 0 ? <p className="mt-3 text-sm text-muted">Enter an amount in USD.</p> : null}
          </div>
        </section>
        {wrappers.length ? (
          <section className="mx-auto max-w-[1200px] px-4 pb-12">
            <div className="rounded-2xl border border-line bg-card p-4 shadow-inset">
              <Filters
                chains={chains}
                issuers={issuers}
                chain={chain}
                issuer={issuer}
                hideIlliquid={hideIlliquid}
                hideStale={hideStale}
                onChain={setChain}
                onIssuer={setIssuer}
                onHideIlliquid={setHideIlliquid}
                onHideStale={setHideStale}
              />
              <div className="mt-4">
                <WrapperTable rows={visible} amount={amount} bestPrice={best?.price ?? null} onOpen={setOpen} />
              </div>
            </div>
          </section>
        ) : null}
      </main>
      {open && data?.asset ? (
        <TokenDetailDrawer
          row={open}
          assetSymbol={data.asset.symbol}
          assetName={data.asset.name}
          assetType={data.asset.assetType}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}
