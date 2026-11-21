export function Hero() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-8 pt-16 text-center">
      <p className="text-sm text-accent">Built with CoinMarketCap API</p>
      <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight text-ink md:text-[52px]">
        Don't overpay for tokenized stocks.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
        WrapWise compares every wrapper of the same asset and shows you the cheapest, fairest one, in dollars.
      </p>
      <a href="/dashboard" className="mt-8 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-medium text-page">
        Try it live →
      </a>
    </section>
  );
}
