const presets = [100, 500, 1000, 5000];

export function AmountCalculator({
  amount,
  onChange,
}: {
  amount: number;
  onChange: (amount: number) => void;
}) {
  return (
    <div className="mt-4">
      <label className="text-sm text-muted" htmlFor="amount">
        Amount in USD
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          id="amount"
          inputMode="decimal"
          className="w-36 rounded-xl border border-line bg-surface px-3 py-2 font-mono text-ink outline-none focus:border-accent"
          value={Number.isFinite(amount) ? amount : ""}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`rounded-xl border px-3 py-2 text-sm ${
              amount === preset ? "border-accent text-accent" : "border-line text-muted hover:border-accent"
            }`}
          >
            ${preset.toLocaleString("en-US")}
          </button>
        ))}
      </div>
    </div>
  );
}
