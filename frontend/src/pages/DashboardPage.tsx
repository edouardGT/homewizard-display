import { useDashboard } from "../hooks/useDashboard";
import { Loading } from "../components/ui/Loading";
import { ErrorBanner } from "../components/layout/ErrorBanner";
import { LivePowerCard } from "../cards/LivePowerCard";
import { EnergyFlowCard } from "../cards/EnergyFlowCard";
import { SolarCard } from "../cards/SolarCard";
import { BatteryCard } from "../cards/BatteryCard";
import { FinancialCard } from "../cards/FinancialCard";
import { ForecastCard } from "../cards/ForecastCard";
import { UtilitiesCard } from "../cards/UtilitiesCard";
import { PlugListCard } from "../cards/PlugListCard";
import { relativeTime } from "../lib/format";

export function DashboardPage() {
  const { data, isLoading, isError, error, isStale } = useDashboard();

  if (isLoading) return <Loading label="Loading dashboard…" />;
  if (isError || !data)
    return <ErrorBanner message={`Backend error: ${(error as Error)?.message ?? "unknown"}`} />;

  const { summary, devices, updatedAt } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Updated {relativeTime(updatedAt)}</span>
        {isStale && <span className="text-amber-400">reconnecting…</span>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LivePowerCard summary={summary} />
        <EnergyFlowCard summary={summary} />
        <SolarCard summary={summary} />
        <BatteryCard summary={summary} />
        <FinancialCard summary={summary} />
        <ForecastCard />
        <UtilitiesCard summary={summary} />
        <PlugListCard devices={devices} />
      </div>
    </div>
  );
}
