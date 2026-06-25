import { Card } from "../components/ui/Card";
import { StatRow } from "../components/ui/StatRow";
import { useForecast } from "../hooks/useForecast";
import { euro, kwh } from "../lib/format";

export function ForecastCard() {
  const { data } = useForecast();
  if (!data) return null;

  const progress = data.daysInMonth ? (data.daysElapsed / data.daysInMonth) * 100 : 0;

  return (
    <Card title="Monthly Forecast" icon="📈">
      <div className="mb-1 flex items-end gap-2">
        <span className="text-3xl font-bold tabular-nums text-white">
          {euro(data.projectedMonth.netCostEur)}
        </span>
        <span className="mb-1 text-sm text-muted">projected</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
      </div>
      <StatRow label="Month to date" value={euro(data.monthToDate.netCostEur)} />
      <StatRow label="Avg / day" value={euro(data.perDayAvgEur)} />
      <StatRow label="Projected import" value={kwh(data.projectedMonth.importKwh)} />
      <StatRow
        label="Days elapsed"
        value={`${data.daysElapsed} / ${data.daysInMonth}`}
        accent="muted"
      />
    </Card>
  );
}
