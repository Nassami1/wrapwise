export function Filters({
  chains,
  issuers,
  chain,
  issuer,
  hideIlliquid,
  hideStale,
  onChain,
  onIssuer,
  onHideIlliquid,
  onHideStale,
}: {
  chains: string[];
  issuers: string[];
  chain: string;
  issuer: string;
  hideIlliquid: boolean;
  hideStale: boolean;
  onChain: (value: string) => void;
  onIssuer: (value: string) => void;
  onHideIlliquid: (value: boolean) => void;
  onHideStale: (value: boolean) => void;
}) {
  const select = "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select className={select} value={chain} onChange={(event) => onChain(event.target.value)} aria-label="Chain">
        <option value="">All chains</option>
        {chains.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select className={select} value={issuer} onChange={(event) => onIssuer(event.target.value)} aria-label="Issuer">
        <option value="">All issuers</option>
        {issuers.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={hideIlliquid} onChange={(event) => onHideIlliquid(event.target.checked)} />
        Hide low-liquidity
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={hideStale} onChange={(event) => onHideStale(event.target.checked)} />
        Hide stale quotes
      </label>
    </div>
  );
}
