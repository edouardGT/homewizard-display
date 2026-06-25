import { useState } from "react";
import { usePlugs } from "../hooks/usePlugs";
import { Card } from "../components/ui/Card";
import { RangeTabs } from "../components/ui/RangeTabs";
import { Loading } from "../components/ui/Loading";
import { ErrorBanner } from "../components/layout/ErrorBanner";
import { EditableName } from "../components/ui/EditableName";
import { PowerToggle } from "../components/ui/PowerToggle";
import { euro, kwh, wattsRaw } from "../lib/format";
import type { Range } from "../types/api";

export function PlugsPage() {
  const [range, setRange] = useState<Range>("day");
  const { data, isLoading, isError, error } = usePlugs(range);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Smart Plugs</h1>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      {isLoading && <Loading />}
      {isError && <ErrorBanner message={`Error: ${(error as Error)?.message}`} />}

      {data && (
        <Card>
          {data.plugs.length === 0 ? (
            <p className="text-sm text-muted">No plug data for this range yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-4">Device</th>
                    <th className="py-2 pr-4 text-right">Now</th>
                    <th className="py-2 pr-4 text-right">Energy</th>
                    <th className="py-2 pr-4 text-right">Cost</th>
                    <th className="py-2 text-right">Power</th>
                  </tr>
                </thead>
                <tbody>
                  {data.plugs.map((p) => (
                    <tr key={p.ip} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4">
                        <span className="mr-2">{p.icon}</span>
                        <EditableName serial={p.serial} name={p.name} />
                        {p.room && <span className="ml-2 text-xs text-muted">{p.room}</span>}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">{wattsRaw(p.currentPowerW)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{kwh(p.energyKwh, 3)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums font-semibold">{euro(p.estimatedCostEur)}</td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end">
                          <PowerToggle
                            serial={p.serial}
                            on={p.powerOn}
                            locked={p.switchLock}
                            online={p.online}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
