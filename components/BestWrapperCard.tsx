import { usd } from "@/lib/format";
import { extraCostVs, fairValueReceived, pickBest, pickCheapest, pickWorstPrice } from "@/lib/scoring";
import type { WrapperView } from "@/lib/types";
import { CmcLink } from "./CmcLink";
import { TokenLogo } from "./TokenLogo";

export function BestWrapperCard({ rows, amount, single }: { rows: WrapperView[]; amount: number; single: boolean }) {
  if (!rows.length) {
    return (
      <section className="rounded-2xl border border-line bg-card p-5 shadow-inset">
        <p className="text-sm text-muted">No wrappers match these filters.</p>
      </section>
    );
  }
  if (single) {
    return (
      <section className="rounded-2xl border border-line bg-card p-5 shadow-inset">
        <p className="text-sm text-muted">Single wrapper, no comparison possible</p>
        <p className="mt-2 flex items-center gap-2 text-xl text-ink">
          <TokenLogo src={rows[0].logo} symbol={rows[0].symbol} size={32} />
          {rows[0].issuerName}, {rows[0].symbol}
          <CmcLink url={rows[0].cmcUrl} symbol={rows[0].symbol} />
        </p>
      </section>
    );
  }
  const best = pickBest(rows);
  const cheapest = pickCheapest(rows);
  const worst = pickWorstPrice(rows);
  if (!best) {
    return (
      <section className="rounded-2xl border border-line bg-card p-5 shadow-inset">
        <p className="text-sm text-muted">No eligible wrapper. Low-liquidity and stale quotes are excluded from Best.</p>
      </section>
    );
  }
  const saved = worst ? extraCostVs(amount, worst.price, best.price, best.anchor) : null;
  const received = fairValueReceived(amount, best.price, best.anchor);
  const amountLabel = Number.isInteger(amount) ? usd(amount, 0) : usd(amount);
  const tradeoff =
    cheapest && cheapest.cryptoId !== best.cryptoId
      ? cheapest.liquidity < best.liquidity
        ? `Cheapest is ${cheapest.symbol}, but its liquidity is lower, so Best is ${best.symbol}.`
        : `Cheapest is ${cheapest.symbol}, but ${best.symbol} scores higher on fairness and issuer strength.`
      : "This wrapper is also the cheapest eligible.";
  return (
    <section className="rounded-2xl border border-accent bg-card p-5 shadow-inset">
      <p className="text-sm text-accent">Best by score</p>
      <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold leading-snug text-ink">
        <TokenLogo src={best.logo} symbol={best.symbol} size={32} />
        {best.issuerName}, {best.symbol}
        <CmcLink url={best.cmcUrl} symbol={best.symbol} />
      </h2>
      {cheapest?.price != null ? (
        <p className="mt-2 text-sm text-ink">
          Cheapest eligible: {cheapest.symbol} at {usd(cheapest.price)}
        </p>
      ) : null}
      {saved != null && Number.isFinite(amount) && amount > 0 ? (
        <p className="mt-1 text-sm text-ink">
          Saves {usd(saved)} vs. worst eligible wrapper on {amountLabel}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-muted">{tradeoff}</p>
      <p className="mt-3 text-sm text-muted">
        You receive ≈ {usd(received)} worth at fair value. Score {best.total} (Fairness {best.fairness}/40 · Liquidity{" "}
        {best.liquidity}/30 · Issuer {best.issuer}/30).
      </p>
    </section>
  );
}
