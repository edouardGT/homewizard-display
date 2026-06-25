import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePlugHistory } from "../hooks/usePlugHistory";
import { Card } from "../components/ui/Card";
import { Tile } from "../components/ui/Tile";
import { RangeTabs } from "../components/ui/RangeTabs";
import { Loading } from "../components/ui/Loading";
import { ErrorBanner } from "../components/layout/ErrorBanner";
import { PowerToggle } from "../components/ui/PowerToggle";
import { euro, kwh, wattsRaw } from "../lib/format";
import type { Range } from "../types/api";

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

export function PlugDetailPage() {
  const { serial = "" } = useParams();
  const [range, setRange] = useState<Range>("day");
  const { data, isLoading, isError } = usePlugHistory(serial, range);

  if (isLoading) return <Loading />;
  if (isError || !data) return <ErrorBanner message="Could not load device." />;

  const chartData = data.points.map((p) => ({ ts: p.ts, w: p.powerW ?? 0 }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/plugs" className="text-muted hover:text-white">
            ←
          </Link>
          <span className="text-2xl">{data.icon}</span>
          <h1 className="text-xl font-bold">{data.name}</h1>
          <PowerToggle serial={data.serial} on={data.powerOn} locked={data.switchLock} online={data.online} />
        </div>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Now" value={wattsRaw(data.currentPowerW)} />
        <Tile label="Peak" value={wattsRaw(data.peakPowerW)} />
        <Tile label="Average" value={wattsRaw(data.avgPowerW)} />
        <Tile label="Energy" value={kwh(data.energyKwh, 3)} accent="house" />
      </div>

      <Card title={`Power — ${range}`} icon="⚡">
        {chartData.length < 2 ? (
          <p className="p-6 text-sm text-muted">Not enough data for this range yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="ts" tickFormatter={fmtTime} stroke="var(--color-muted)" fontSize={11} minTickGap={40} />
              <YAxis stroke="var(--color-muted)" fontSize={11} unit=" W" width={60} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                labelFormatter={(ts) => fmtTime(Number(ts))}
                formatter={(v) => `${Math.round(Number(v))} W`}
              />
              <Area type="monotone" dataKey="w" name="Power" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Cost" icon="💶">
        <Tile label={`Estimated cost (${range})`} value={euro(data.estimatedCostEur)} />
      </Card>
    </div>
  );
}
