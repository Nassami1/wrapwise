const cards = [
  ["Real premium, not just price", "Each wrapper is priced against the CMC aggregate tokenized price, then shown as dollars you keep or give up."],
  ["Explainable score", "Fairness, liquidity, and issuer strength are scored separately. The total is just those three numbers added."],
  ["Live CMC data, no other source", "Quotes, issuers, and token metadata come from the CoinMarketCap API. No second price feed."],
];

export function FeatureCards() {
  return (
    <section className="mx-auto grid max-w-[1200px] gap-4 px-4 py-16 md:grid-cols-3">
      {cards.map(([title, body]) => (
        <article key={title} className="rounded-2xl border border-line bg-card p-5 shadow-inset">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        </article>
      ))}
    </section>
  );
}
