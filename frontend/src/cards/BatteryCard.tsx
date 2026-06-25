import { Card } from "../components/ui/Card";
import { StatRow } from "../components/ui/StatRow";
import { percent, watts } from "../lib/format";
import type { Summary } from "../types/api";

export function BatteryCard({ summary }: { summary: Summary }) {
  const soc = summary.batterySoc;
  const power = summary.batteryPowerW ?? 0;
  const state = power > 1 ? "Discharging" : power < -1 ? "Charging" : "Idle";
  const pct = typeof soc === "number" ? Math.max(0, Math.min(100, soc)) : 0;

  return (
    <Card title="Battery" icon="🔋">
      <div className="mb-3 flex items-end gap-2">
        <span className="text-3xl font-bold tabular-nums text-[var(--color-battery)]">
          {percent(soc)}
        </span>
        <span className="mb-1 text-sm text-muted">{state}</span>
      </div>
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-[var(--color-battery)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <StatRow label="Power" value={watts(Math.abs(power))} />
      <StatRow label="State" value={state} accent="muted" />
    </Card>
  );
}
