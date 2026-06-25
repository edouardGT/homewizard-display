import type { ReactNode } from "react";

interface TileProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: "default" | "grid" | "solar" | "battery" | "house" | "positive" | "negative";
}

const accentText: Record<NonNullable<TileProps["accent"]>, string> = {
  default: "text-white",
  grid: "text-[var(--color-grid)]",
  solar: "text-[var(--color-solar)]",
  battery: "text-[var(--color-battery)]",
  house: "text-[var(--color-house)]",
  positive: "text-[var(--color-positive)]",
  negative: "text-[var(--color-negative)]",
};

export function Tile({ label, value, sub, icon, accent = "default" }: TileProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${accentText[accent]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
