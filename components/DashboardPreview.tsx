export function DashboardPreview() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-16">
      <a
        href="/dashboard"
        className="block overflow-hidden rounded-2xl border border-line bg-surface"
      >
        <img
          src="/dashboard-preview.png"
          alt="WrapWise dashboard, Gold wrappers compared"
          className="w-full"
        />
      </a>
    </section>
  );
}
