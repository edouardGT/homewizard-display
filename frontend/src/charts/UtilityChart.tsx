import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "../types/api";

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

/** Cumulative gas / water meter readings over the range. */
export function UtilityChart({ points }: { points: HistoryPoint[] }) {
  const data = points
    .filter((p) => p.gasM3 != null || p.waterM3 != null)
    .map((p) => ({ ts: p.ts, gas: p.gasM3, water: p.waterM3 }));

  if (!data.length) return <p className="p-6 text-sm text-muted">No utility data for this range.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="ts" tickFormatter={fmtTime} stroke="var(--color-muted)" fontSize={11} minTickGap={40} />
        <YAxis stroke="var(--color-muted)" fontSize={11} width={50} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
          labelFormatter={(ts) => fmtTime(Number(ts))}
        />
        <Line type="monotone" dataKey="gas" name="Gas m³" stroke="var(--color-grid)" dot={false} connectNulls />
        <Line type="monotone" dataKey="water" name="Water m³" stroke="var(--color-house)" dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
