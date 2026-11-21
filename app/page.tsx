import { DashboardPreview } from "@/components/DashboardPreview";
import { Faq } from "@/components/Faq";
import { FeatureCards } from "@/components/FeatureCards";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { getComparison } from "@/lib/compare";
import { utcStamp } from "@/lib/format";
import { GITHUB_URL } from "@/lib/site";
import { redirect } from "next/navigation";

const steps = [
  ["1. Pick an asset", "Search NVDA, Gold, SPY, AAPL, or TSLA and set a dollar amount."],
  ["2. We fetch live CMC RWA quotes", "One CoinMarketCap quotes call returns every wrapper and the aggregate price."],
  ["3. Get the best wrapper and why", "The score splits fairness, liquidity, and issuer strength. The card is the dollar answer."],
];

export default async function Page({
  searchParams,
}: {
  searchParams: { asset?: string; amount?: string };
}) {
  if (searchParams.asset) {
    const query = new URLSearchParams({ asset: searchParams.asset });
    if (searchParams.amount) query.set("amount", searchParams.amount);
    redirect(`/dashboard?${query}`);
  }

  const env = await getComparison("GOLD");
  const data = env.data;
  const stats = [
    ["Assets tracked", data.stats.assetsTracked],
    ["Wrappers compared", data.stats.wrappersCompared],
    ["Issuers covered", data.stats.issuersCovered],
    ["Last updated", data.asset?.lastUpdated ? utcStamp(data.asset.lastUpdated) : "n/a"],
  ];

  return (
    <>
      <Nav home />
      <main>
        <Hero />
        <DashboardPreview />
        <section id="how" className="mx-auto max-w-[1200px] px-4 py-8">
          <h2 className="text-center text-[30px] font-semibold text-ink">How it works</h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {steps.map(([title, body]) => (
              <li key={title} className="rounded-2xl border border-line bg-card p-5">
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>
        <FeatureCards />
        <section className="mx-auto grid max-w-[1200px] gap-4 px-4 py-4 sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-line bg-card p-4">
              <p className="text-xs text-faint">{label}</p>
              <p className="mt-1 text-lg text-ink">{value ?? "n/a"}</p>
            </div>
          ))}
        </section>
        <Faq />
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-10 text-sm text-muted">
            <div className="flex items-center gap-2 text-ink">
              <img src="/logo.svg" alt="" width={32} height={32} />
              <span>WrapWise</span>
            </div>
            <p>Built with CoinMarketCap API. Not financial advice.</p>
            <p>
              Source {env.source} · fetched {utcStamp(env.fetchedAt)} ·{" "}
              {(data.endpoints.length ? data.endpoints : ["GET /v5/real-world-assets/quotes/latest"]).join(" · ")}
            </p>
            {GITHUB_URL ? (
              <a className="text-accent" href={GITHUB_URL}>
                GitHub
              </a>
            ) : null}
          </div>
        </footer>
      </main>
    </>
  );
}
