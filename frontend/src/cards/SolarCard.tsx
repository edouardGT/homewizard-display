import { Card } from "../components/ui/Card";
import { StatRow } from "../components/ui/StatRow";
import { kwh, watts } from "../lib/format";
import type { Summary } from "../types/api";

export function SolarCard({ summary }: { summary: Summary }) {
  return (
    <Card title="Solar" icon="☀️">
      <div className="mb-3 text-3xl font-bold tabular-nums text-[var(--color-solar)]">
        {watts(summary.pvPowerW)}
      </div>
      <StatRow label="Self-consumed today" value={kwh(summary.todaySelfKwh)} />
      <StatRow label="Saving today" value={`€${summary.todaySolarBatterySavingEur.toFixed(2)}`} accent="positive" />
    </Card>
  );
}
