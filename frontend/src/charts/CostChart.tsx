import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoryResponse } from "../types/api";

export function CostChart({ finance }: { finance: HistoryResponse["finance"] }) {
  const data = [
    { name: "Gross", value: finance.grossElectricityCostEur, color: "var(--color-grid)" },
    { name: "Solar saving", value: finance.solarSavingEur, color: "var(--color-positive)" },
    { name: "Export", value: finance.exportRevenueEur, color: "var(--color-battery)" },
    { name: "Net", value: finance.netElectricityCostEur, color: "var(--color-accent)" },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={11} />
        <YAxis stroke="var(--color-muted)" fontSize={11} unit=" €" width={50} />
        <Tooltip
          cursor={{ fill: "var(--color-surface-2)" }}
          contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
          formatter={(v) => `€${Number(v).toFixed(2)}`}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
