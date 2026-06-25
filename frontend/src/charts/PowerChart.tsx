import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "../types/api";

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

export function PowerChart({ points }: { points: HistoryPoint[] }) {
  const data = points.map((p) => ({
    ts: p.ts,
    grid: p.gridPowerW ?? 0,
    solar: p.pvPowerW ?? 0,
    battery: p.batteryPowerW ?? 0,
  }));

  if (!data.length) return <p className="p-6 text-sm text-muted">No data for this range yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="ts" tickFormatter={fmtTime} stroke="var(--color-muted)" fontSize={11} minTickGap={40} />
        <YAxis stroke="var(--color-muted)" fontSize={11} unit=" W" width={60} />
        <Tooltip
          contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
          labelFormatter={(ts) => fmtTime(Number(ts))}
          formatter={(v) => `${Math.round(Number(v))} W`}
        />
        <Legend />
        <Area type="monotone" dataKey="grid" name="Grid" stroke="var(--color-grid)" fill="var(--color-grid)" fillOpacity={0.2} />
        <Area type="monotone" dataKey="solar" name="Solar" stroke="var(--color-solar)" fill="var(--color-solar)" fillOpacity={0.2} />
        <Area type="monotone" dataKey="battery" name="Battery" stroke="var(--color-battery)" fill="var(--color-battery)" fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
