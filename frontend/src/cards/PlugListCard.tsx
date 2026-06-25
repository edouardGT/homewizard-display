import { Card } from "../components/ui/Card";
import { EditableName } from "../components/ui/EditableName";
import { PowerToggle } from "../components/ui/PowerToggle";
import { wattsRaw } from "../lib/format";
import type { Device } from "../types/api";

export function PlugListCard({ devices }: { devices: Device[] }) {
  const plugs = devices
    .filter((d) => d.type === "plug")
    .sort((a, b) => (Number(b.data?.powerW) || 0) - (Number(a.data?.powerW) || 0));

  return (
    <Card title="Smart Plugs" icon="🔌" className="md:col-span-2">
      {plugs.length === 0 ? (
        <p className="text-sm text-muted">No plugs reporting.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {plugs.map((p) => (
            <li key={p.ip} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2">
                <span className="text-base">{p.icon}</span>
                <EditableName serial={p.serial} name={p.name} className="text-sm" />
                {!p.online && (
                  <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300">
                    offline
                  </span>
                )}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-sm font-semibold tabular-nums">
                  {wattsRaw(typeof p.data?.powerW === "number" ? p.data.powerW : null)}
                </span>
                <PowerToggle
                  serial={p.serial}
                  on={p.data?.powerOn}
                  locked={p.data?.switchLock}
                  online={p.online}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
