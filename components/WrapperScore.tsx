export function WrapperScore({
  fairness,
  liquidity,
  issuer,
  total,
}: {
  fairness: number;
  liquidity: number;
  issuer: number;
  total: number;
}) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer tabular-nums text-ink">{total}</summary>
      <p className="mt-1 text-xs text-muted">
        Fairness {fairness}/40 · Liquidity {liquidity}/30 · Issuer {issuer}/30 = {total}
      </p>
    </details>
  );
}
