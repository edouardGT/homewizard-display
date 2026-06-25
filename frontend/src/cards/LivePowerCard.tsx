import { Card } from "../components/ui/Card";
import { Tile } from "../components/ui/Tile";
import { amps, watts, wattsRaw } from "../lib/format";
import type { Summary } from "../types/api";

export function LivePowerCard({ summary }: { summary: Summary }) {
  const importing = (summary.powerW ?? 0) >= 0;
  return (
    <Card title="Live Power" icon="⚡" className="md:col-span-2">
      <div className="mb-4 flex items-end gap-3">
        <span
          className={`text-5xl font-extrabold tabular-nums ${
            importing ? "text-[var(--color-grid)]" : "text-[var(--color-positive)]"
          }`}
        >
          {watts(summary.powerW)}
        </span>
        <span className="mb-1 text-sm text-muted">{importing ? "importing" : "exporting"}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile label="Phase L1" value={wattsRaw(summary.powerL1W)} />
        <Tile label="Phase L2" value={wattsRaw(summary.powerL2W)} />
        <Tile label="Phase L3" value={wattsRaw(summary.powerL3W)} />
        <Tile label="Current" value={amps(summary.currentA)} />
        <Tile label="15-min avg" value={wattsRaw(summary.averagePower15mW)} />
        <Tile label="Plugs total" value={wattsRaw(summary.plugTotalW)} accent="house" />
      </div>
    </Card>
  );
}
