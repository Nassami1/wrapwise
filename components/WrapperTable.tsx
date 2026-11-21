import { compactUsd, pct, usd } from "@/lib/format";
import { extraCostVs, fairValueReceived } from "@/lib/scoring";
import type { WrapperView } from "@/lib/types";
import { CmcLink } from "./CmcLink";
import { PremiumSparkline } from "./PremiumSparkline";
import { TokenLogo } from "./TokenLogo";
import { WrapperScore } from "./WrapperScore";

function moneyLine(row: WrapperView, amount: number, bestPrice: number | null) {
  const received = fairValueReceived(amount, row.price, row.anchor);
  const extra = bestPrice == null ? null : extraCostVs(amount, row.price, bestPrice, row.anchor);
  const extraText =
    extra == null
      ? ""
      : extra > 0.005
        ? ` · ${usd(extra)} more expensive than Best`
        : extra < -0.005
          ? ` · ${usd(Math.abs(extra))} cheaper than Best`
          : " · Same fair value as Best";
  return `You receive ≈ ${usd(received)} at fair value${extraText}`;
}

function History({ row, wide = false }: { row: WrapperView; wide?: boolean }) {
  return (
    <div>
      <PremiumSparkline points={row.history} wide={wide} id={String(row.cryptoId)} />
      {row.history.length >= 2 && row.premiumRange ? (
        <p className="mt-1 text-[11px] leading-tight text-faint">
          {pct(row.premiumRange.min)} to {pct(row.premiumRange.max)}
        </p>
      ) : null}
    </div>
  );
}

function Flags({ row }: { row: WrapperView }) {
  return (
    <p className="text-xs">
      {row.flags.map((flag) => (
        <span key={flag} className={`mr-2 ${flag === "Low liquidity" ? "text-[#F59E0B]" : "text-[#F87171]/80"}`}>
          {flag}
        </span>
      ))}
      <span className="text-faint">
        {row.issuerTokens == null
          ? "Issuer token count unknown"
          : `${row.issuerTokens} ${row.issuerTokens === 1 ? "token" : "tokens"} issued`}
      </span>
    </p>
  );
}

export function WrapperTable({
  rows,
  amount,
  bestPrice,
  onOpen,
}: {
  rows: WrapperView[];
  amount: number;
  bestPrice: number | null;
  onOpen: (row: WrapperView) => void;
}) {
  if (!rows.length) return <p className="text-muted">No wrappers match these filters.</p>;
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full border-collapse text-left text-sm text-muted">
          <thead className="text-xs text-faint">
            <tr>
              {["Token", "Issuer", "Chain", "Price", "Premium", "24h volume", "Score", "Premium history"].map((head) => (
                <th key={head} className="border-b border-line px-2 py-2 font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.cryptoId} title={moneyLine(row, amount, bestPrice)} className={`border-b border-line align-top ${row.price == null || row.volume24h == null ? "opacity-50" : ""}`}>
                <td className="px-2 py-3">
                  <span className="flex items-start gap-2">
                    <button type="button" onClick={() => onOpen(row)} className="flex items-center gap-2 text-left hover:text-accent">
                      <TokenLogo src={row.logo} symbol={row.symbol} />
                      <span>
                        <span className="font-medium text-ink">{row.symbol}</span>
                        <span className="mt-1 block text-xs text-faint">{row.name}</span>
                      </span>
                    </button>
                    <span className="mt-1">
                      <CmcLink url={row.cmcUrl} symbol={row.symbol} />
                    </span>
                  </span>
                </td>
                <td className="px-2 py-3">{row.issuerName}</td>
                <td className="px-2 py-3">{row.chain ?? "Unknown"}</td>
                <td className="px-2 py-3 font-mono tabular-nums text-ink">
                  {usd(row.price)}
                  {row.normalized ? <span className="mt-1 block text-[10px] font-sans text-accent">Normalized to oz</span> : null}
                </td>
                <td className={`px-2 py-3 tabular-nums ${row.premiumPct != null && row.premiumPct > 0 ? "text-[#F87171]/80" : "text-[#4ADE80]/80"}`}>
                  {pct(row.premiumPct)}
                </td>
                <td className="px-2 py-3 tabular-nums">{compactUsd(row.volume24h)}</td>
                <td className="px-2 py-3">
                  <WrapperScore fairness={row.fairness} liquidity={row.liquidity} issuer={row.issuer} total={row.total} />
                  <Flags row={row} />
                </td>
                <td className="w-28 px-2 py-3">
                  <History row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <article key={row.cryptoId} title={moneyLine(row, amount, bestPrice)} className={`rounded-2xl border border-line bg-surface p-4 text-sm text-muted ${row.price == null || row.volume24h == null ? "opacity-50" : ""}`}>
            <span className="flex items-start gap-2">
              <button type="button" onClick={() => onOpen(row)} className="flex items-center gap-2 text-left">
                <TokenLogo src={row.logo} symbol={row.symbol} />
                <span>
                  <span className="text-base font-medium text-ink">{row.symbol}</span>
                  <span className="mt-1 block text-xs text-faint">{row.name}</span>
                </span>
              </button>
              <span className="mt-1">
                <CmcLink url={row.cmcUrl} symbol={row.symbol} />
              </span>
            </span>
            <p className="mt-2">{row.issuerName} · {row.chain ?? "Unknown"}</p>
            <p className="mt-1 font-mono tabular-nums text-ink">
              {usd(row.price)} · {pct(row.premiumPct)} · {compactUsd(row.volume24h)}
              {row.normalized ? <span className="mt-1 block font-sans text-[10px] text-accent">Normalized to oz</span> : null}
            </p>
            <div className="mt-2">
              <WrapperScore fairness={row.fairness} liquidity={row.liquidity} issuer={row.issuer} total={row.total} />
              <Flags row={row} />
              <History row={row} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
