export function PremiumSparkline({
  points,
  wide = false,
  id,
}: {
  points: number[];
  wide?: boolean;
  id: string;
}) {
  const w = wide ? 280 : 88;
  const h = wide ? 64 : 28;
  const ready = points.length >= 2;
  const series = ready ? points : [0, 0];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const coords = series.map((point, index) => {
    const x = (index / (series.length - 1)) * (w - 2) + 1;
    const y = max === min ? h / 2 : h - ((point - min) / (max - min)) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${coords[0][0].toFixed(1)},${h} ${line} ${coords[coords.length - 1][0].toFixed(1)},${h}`;
  const grad = `prem-${wide ? "w" : "s"}-${id}`;
  return (
    <div>
      <svg width={w} height={h} aria-hidden="true">
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5FA8A0" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#5FA8A0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${grad})`} />
        <polyline points={line} fill="none" stroke="#5FA8A0" strokeWidth="2" />
      </svg>
      {ready ? null : <p className="text-[11px] leading-tight text-faint">History collecting</p>}
    </div>
  );
}
