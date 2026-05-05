import { Minus, Plus } from "lucide-react";

export const QuantityStepper = ({
  value,
  onChange,
  min = 1,
  max = 99,
}: { value: number; onChange: (n: number) => void; min?: number; max?: number }) => {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card overflow-hidden shadow-sm">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-9 w-9 grid place-items-center text-brown-mid hover:bg-secondary transition-colors disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus size={14} />
      </button>
      <span className="w-9 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-9 w-9 grid place-items-center text-brown-mid hover:bg-secondary transition-colors disabled:opacity-40"
        disabled={value >= max}
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
