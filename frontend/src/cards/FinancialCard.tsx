import { Card } from "../components/ui/Card";
import { StatRow } from "../components/ui/StatRow";
import { eurPerKwh, euro, kwh, wattsRaw } from "../lib/format";
import type { Summary } from "../types/api";

export function FinancialCard({ summary }: { summary: Summary }) {
  return (
    <Card title="Today's Cost" icon="💶">
      <div className="mb-3 text-3xl font-bold tabular-nums text-white">
        {euro(summary.todayNetSpendEur)}
      </div>
      <StatRow label="Gross cost" value={euro(summary.todayGrossCostEur)} />
      <StatRow label="Solar/battery saving" value={euro(summary.todaySolarBatterySavingEur)} accent="positive" />
      <StatRow label="Grid import today" value={kwh(summary.todayGridImportKwh)} />
      <StatRow label="Current price" value={eurPerKwh(summary.actualPriceEurKwh)} />
      <StatRow label="Monthly peak" value={wattsRaw(summary.monthlyPeakW)} accent="muted" />
    </Card>
  );
}
