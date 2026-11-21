export function CmcLink({ url, symbol }: { url: string | null; symbol: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View ${symbol} on CoinMarketCap`}
      title={`View ${symbol} on CoinMarketCap`}
      onClick={(event) => event.stopPropagation()}
      className="inline-flex shrink-0 text-muted hover:text-ink"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
        <path d="M6 3.5H3.5v9h9V10" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8.5 3.5H12.5V7.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12.2 3.8 7.2 8.8" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </a>
  );
}
