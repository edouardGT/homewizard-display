import type { Range } from "../../types/api";

const RANGES: { value: Range; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

interface RangeTabsProps {
  value: Range;
  onChange: (range: Range) => void;
}

export function RangeTabs({ value, onChange }: RangeTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === r.value ? "bg-accent text-white" : "text-muted hover:text-white"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
