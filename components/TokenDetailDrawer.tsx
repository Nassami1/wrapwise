"use client";

import { compactUsd, pct, usd, utcStamp } from "@/lib/format";
import type { CryptoQuote, WrapperView } from "@/lib/types";
import { useEffect, useState } from "react";
import { PremiumSparkline } from "./PremiumSparkline";
import { TokenLogo } from "./TokenLogo";

export function TokenDetailDrawer({
  row,
  assetSymbol,
  assetName,
  assetType,
  onClose,
}: {
  row: WrapperView;
  assetSymbol: string;
  assetName: string;
  assetType: string;
  onClose: () => void;
}) {
  const [quote, setQuote] = useState<CryptoQuote | null>(null);
  const [source, setSource] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [about, setAbout] = useState<string>("");

  useEffect(() => {
    let cancel = false;
    fetch(`/api/crypto/quote?id=${row.cryptoId}`)
      .then((res) => res.json())
      .then((body) => {
        if (cancel) return;
        setQuote(body.data);
        setSource(body.source);
        setNote(body.error ?? "");
      })
      .catch(() => {
        if (!cancel) setNote("Crypto quote request failed.");
      });
    fetch(`/api/rwa/info?symbol=${encodeURIComponent(assetSymbol)}`)
      .then((res) => res.json())
      .then((body) => {
        if (cancel) return;
        const description = body.data?.about?.description;
        if (typeof description === "string") setAbout(description);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [row.cryptoId, assetSymbol]);

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/50">
      <button type="button" aria-label="Close details" className="h-full flex-1" onClick={onClose} />
      <aside className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-card p-5 shadow-inset transition duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <TokenLogo src={row.logo} symbol={row.symbol} size={32} />
            <div>
              <p className="text-sm text-accent">{row.issuerName}</p>
              <h2 className="text-2xl font-semibold text-ink">{row.symbol}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-line px-3 py-1 text-sm text-muted">
            Close
          </button>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-faint">Asset</dt>
            <dd className="text-ink">{assetName}</dd>
          </div>
          <div>
            <dt className="text-faint">Type</dt>
            <dd className="text-ink">{assetType}</dd>
          </div>
          <div>
            <dt className="text-faint">Chain</dt>
            <dd className="text-ink">{row.chain ?? "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-faint">RWA price</dt>
            <dd className="font-mono text-ink">{usd(row.price)}</dd>
          </div>
        </dl>
        {about ? <p className="mt-4 text-sm leading-relaxed text-muted">{about.slice(0, 320)}{about.length > 320 ? "…" : ""}</p> : null}
        <h3 className="mt-6 text-sm font-medium text-ink">Linked crypto token</h3>
        <p className="mt-1 text-xs text-faint">
          crypto_id {row.cryptoId}
          {source ? ` · ${source}` : ""}
          {quote?.lastUpdated ? ` · ${utcStamp(quote.lastUpdated)}` : ""}
        </p>
        {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
        {quote ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-faint">Price</dt>
              <dd className="font-mono text-ink">{usd(quote.price)}</dd>
            </div>
            <div>
              <dt className="text-faint">24h</dt>
              <dd className={quote.percentChange24h != null && quote.percentChange24h < 0 ? "text-[#F87171]/80" : "text-[#4ADE80]/80"}>
                {pct(quote.percentChange24h)}
              </dd>
            </div>
            <div>
              <dt className="text-faint">Market cap</dt>
              <dd className="text-ink">{compactUsd(quote.marketCap)}</dd>
            </div>
            <div>
              <dt className="text-faint">Volume</dt>
              <dd className="text-ink">{compactUsd(quote.volume24h)}</dd>
            </div>
          </dl>
        ) : null}
        <div className="mt-4">
          <PremiumSparkline points={row.history} wide id={`drawer-${row.cryptoId}`} />
          {row.history.length >= 2 && row.premiumRange ? (
            <p className="mt-1 text-[11px] text-faint">
              {pct(row.premiumRange.min)} to {pct(row.premiumRange.max)}
            </p>
          ) : null}
        </div>
        {row.cmcUrl ? (
          <a href={row.cmcUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-sm text-accent">
            View on CoinMarketCap ↗
          </a>
        ) : null}
      </aside>
    </div>
  );
}
