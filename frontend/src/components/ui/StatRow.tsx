interface StatRowProps {
  label: string;
  value: string;
  accent?: "default" | "positive" | "negative" | "muted";
}

const accentClass: Record<NonNullable<StatRowProps["accent"]>, string> = {
  default: "text-white",
  positive: "text-[var(--color-positive)]",
  negative: "text-[var(--color-negative)]",
  muted: "text-muted",
};

export function StatRow({ label, value, accent = "default" }: StatRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${accentClass[accent]}`}>{value}</span>
    </div>
  );
}
