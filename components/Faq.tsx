const items = [
  ["What is a wrapper?", "A wrapper is a token that tracks a real-world asset, such as a stock or gold, issued by a company on a blockchain."],
  ["Why do prices differ?", "Issuers, chains, and liquidity differ. One token can trade above the aggregate tokenized price while another trades below it."],
  ["Is this financial advice?", "No. WrapWise is an informational comparison only. Not financial advice."],
  ["Where does the data come from?", "CoinMarketCap RWA quotes, the issuer list, and the linked crypto quote for a token you open. Nothing is ranked from another price source."],
  ["Why is a cheap wrapper not Best?", "A quote is excluded from Best when 24h volume is under $10,000 or the quote is older than 15 minutes. A volatile premium is flagged and still eligible."],
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-[1200px] px-4 py-8">
      <h2 className="text-[30px] font-semibold text-ink">FAQ</h2>
      <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
        {items.map(([q, a]) => (
          <details key={q} className="px-5 py-4">
            <summary className="cursor-pointer text-ink">{q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
