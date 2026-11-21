import { GITHUB_URL } from "@/lib/site";

const links = [
  ["Product", "/dashboard"],
  ["How it works", "/#how"],
  ["FAQ", "/#faq"],
];

export function Nav({ home = false }: { home?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page/95">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-4 py-3">
        <a href="/" className="flex items-center gap-2 text-ink">
          <img src="/logo.svg" alt="" width={32} height={32} />
          <span className="text-[15px] font-semibold">WrapWise</span>
        </a>
        {home ? (
          <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
            {links.map(([label, href]) => (
              <a key={href} href={href} className="hover:text-ink">
                {label}
              </a>
            ))}
            {GITHUB_URL ? (
              <a href={GITHUB_URL} className="hover:text-ink">
                GitHub
              </a>
            ) : (
              <span className="text-faint">GitHub</span>
            )}
          </nav>
        ) : null}
        {home ? (
          <a href="/dashboard" className="ml-auto rounded-xl bg-accent px-3 py-2 text-sm font-medium text-page">
            Try it live
          </a>
        ) : (
          <a href="/" className="ml-auto text-sm text-muted hover:text-ink">
            ← Back to home
          </a>
        )}
      </div>
    </header>
  );
}
