import { Card } from "../components/ui/Card";
import { deriveEnergyFlow, type FlowEdge } from "../hooks/useEnergyFlow";
import { watts } from "../lib/format";
import type { Summary } from "../types/api";

interface NodeProps {
  x: number;
  y: number;
  icon: string;
  label: string;
  value: string;
  color: string;
}

function FlowNode({ x, y, icon, label, value, color }: NodeProps) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="34" fill="var(--color-surface-2)" stroke={color} strokeWidth="2" />
      <text textAnchor="middle" y="-4" fontSize="20">
        {icon}
      </text>
      <text textAnchor="middle" y="14" fontSize="9" fill="var(--color-muted)">
        {label}
      </text>
      <text textAnchor="middle" y="52" fontSize="11" fontWeight="700" fill="#e5e7eb">
        {value}
      </text>
    </g>
  );
}

function FlowPath({ d, edge, color }: { d: string; edge: FlowEdge; color: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={edge.active ? color : "var(--color-border)"}
      strokeWidth={edge.active ? 3 : 2}
      className={edge.active ? "flow-line-active" : undefined}
      strokeLinecap="round"
    />
  );
}

export function EnergyFlowCard({ summary }: { summary: Summary }) {
  const flow = deriveEnergyFlow(summary);
  const grid = summary.powerW ?? 0;
  const gridEdge = grid >= 0 ? flow.gridToHouse : flow.houseToGrid;
  const battery = summary.batteryPowerW ?? 0;
  const batteryEdge = battery >= 0 ? flow.batteryToHouse : flow.houseToBattery;

  return (
    <Card title="Energy Flow" icon="🔀" className="md:col-span-2">
      <svg viewBox="0 0 400 240" className="w-full" role="img" aria-label="Energy flow diagram">
        {/* Solar → House (vertical) */}
        <FlowPath d="M200 78 L200 116" edge={flow.solarToHouse} color="var(--color-solar)" />
        {/* Grid ↔ House (horizontal left) */}
        <FlowPath d="M78 150 L156 150" edge={gridEdge} color="var(--color-grid)" />
        {/* Battery ↔ House (horizontal right) */}
        <FlowPath d="M322 150 L244 150" edge={batteryEdge} color="var(--color-battery)" />

        <FlowNode
          x={200}
          y={44}
          icon="☀️"
          label="Solar"
          value={watts(summary.pvPowerW)}
          color="var(--color-solar)"
        />
        <FlowNode
          x={50}
          y={150}
          icon="🏭"
          label={grid >= 0 ? "Grid in" : "Grid out"}
          value={watts(Math.abs(grid))}
          color="var(--color-grid)"
        />
        <FlowNode
          x={200}
          y={150}
          icon="🏠"
          label="Home"
          value={watts(flow.houseW)}
          color="var(--color-house)"
        />
        <FlowNode
          x={350}
          y={150}
          icon="🔋"
          label={battery >= 0 ? "Battery out" : "Battery in"}
          value={watts(Math.abs(battery))}
          color="var(--color-battery)"
        />
      </svg>
    </Card>
  );
}
