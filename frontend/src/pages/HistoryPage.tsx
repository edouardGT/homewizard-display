import { useState } from "react";
import { useHistory } from "../hooks/useHistory";
import { Card } from "../components/ui/Card";
import { StatRow } from "../components/ui/StatRow";
import { RangeTabs } from "../components/ui/RangeTabs";
import { Loading } from "../components/ui/Loading";
import { ErrorBanner } from "../components/layout/ErrorBanner";
import { PowerChart } from "../charts/PowerChart";
import { CostChart } from "../charts/CostChart";
import { UtilityChart } from "../charts/UtilityChart";
import { cubicMeters, euro, kwh, percent } from "../lib/format";
import type { Range } from "../types/api";

export function HistoryPage() {
  const [range, setRange] = useState<Range>("day");
  const { data, isLoading, isError, error } = useHistory(range);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">History &amp; Analytics</h1>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorBanner message={`Error: ${(error as Error)?.message}`} />}

      {data && (
        <>
          <Card title="Power" icon="⚡" className="md:col-span-2">
            <PowerChart points={data.points} />
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title="Cost breakdown" icon="💶">
              <CostChart finance={data.finance} />
            </Card>
            <Card title="Gas &amp; Water" icon="🚰">
              <UtilityChart points={data.points} />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card title="Electricity" icon="🔌">
              <StatRow label="Grid import" value={kwh(data.electricity.gridImportKwh)} />
              <StatRow label="Grid export" value={kwh(data.electricity.gridExportKwh)} accent="positive" />
              <StatRow label="Net cost" value={euro(data.finance.netElectricityCostEur)} />
            </Card>
            <Card title="Solar &amp; Battery" icon="☀️">
              <StatRow label="Production" value={kwh(data.solar.productionKwh)} />
              <StatRow label="Self-consumed" value={kwh(data.solar.selfConsumedKwh)} />
              <StatRow label="Self-consumption" value={percent(data.solar.selfConsumptionPct)} />
              <StatRow label="Battery charged" value={kwh(data.battery.chargedKwh)} />
              <StatRow label="Battery discharged" value={kwh(data.battery.dischargedKwh)} />
            </Card>
            <Card title="Utilities" icon="🔥">
              <StatRow label="Gas used" value={cubicMeters(data.gas.usedM3)} />
              <StatRow label="Gas cost" value={euro(data.gas.estimatedCostEur)} />
              <StatRow label="Water used" value={cubicMeters(data.water.usedM3)} />
              <StatRow label="Water cost" value={euro(data.water.estimatedCostEur)} />
              <StatRow label="Total utility cost" value={euro(data.finance.totalUtilityCostEur)} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
