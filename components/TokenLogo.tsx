export function TokenLogo({ src, symbol, size = 28 }: { src: string | null; symbol: string; size?: number }) {
  const letter = (symbol.replace(/[^A-Za-z0-9]/g, "")[0] || "?").toUpperCase();
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span aria-hidden="true" className="absolute inset-0 inline-flex items-center justify-center rounded-full border border-line bg-surface text-[11px] text-ink">
        {letter}
      </span>
      {src ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="relative h-full w-full rounded-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </span>
  );
}
