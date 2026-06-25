import { useState } from "react";
import { useSchedules, useScheduleMutations } from "../hooks/useSchedules";
import { useDashboard } from "../hooks/useDashboard";
import { Card } from "../components/ui/Card";
import { Loading } from "../components/ui/Loading";
import { ErrorBanner } from "../components/layout/ErrorBanner";
import type { Schedule, ScheduleInput, ScheduleKind } from "../types/api";

const DAYS = [
  { v: 1, l: "Mon" },
  { v: 2, l: "Tue" },
  { v: 3, l: "Wed" },
  { v: 4, l: "Thu" },
  { v: 5, l: "Fri" },
  { v: 6, l: "Sat" },
  { v: 0, l: "Sun" },
];

function describe(s: Schedule, nameOf: (serial: string) => string): string {
  const who = nameOf(s.serial);
  if (s.kind === "time") {
    const days = s.days ? s.days.split(",").map((d) => DAYS.find((x) => x.v === Number(d))?.l).join(" ") : "every day";
    return `Turn ${s.action} ${who} at ${s.time_hhmm} (${days})`;
  }
  if (s.kind === "price") {
    return `Turn ${s.action} ${who} when price is ${s.price_dir} €${s.price_threshold}/kWh`;
  }
  return `Turn off ${who} after ${s.standby_min} min below ${s.standby_w} W`;
}

export function SchedulesPage() {
  const { data, isLoading, isError } = useSchedules();
  const dash = useDashboard();
  const { create, update, remove } = useScheduleMutations();

  const plugs = (dash.data?.devices ?? []).filter((d) => d.type === "plug" && d.serial);
  const nameOf = (serial: string) => plugs.find((p) => p.serial === serial)?.name ?? serial;

  if (isLoading) return <Loading />;
  if (isError || !data) return <ErrorBanner message="Could not load schedules." />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Schedules</h1>

      <Card title="Automations" icon="⏱️">
        {data.schedules.length === 0 ? (
          <p className="text-sm text-muted">No automations yet. Add one below.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {data.schedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm">
                  <span className="mr-2 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-muted">
                    {s.kind}
                  </span>
                  {describe(s, nameOf)}
                </span>
                <span className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      update.mutate({
                        id: s.id,
                        input: { ...toInput(s), enabled: s.enabled === 0 },
                      })
                    }
                    className={`rounded px-2 py-0.5 text-xs ${
                      s.enabled ? "bg-[var(--color-positive)]/20 text-[var(--color-positive)]" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {s.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    onClick={() => remove.mutate(s.id)}
                    className="text-xs text-[var(--color-negative)] hover:underline"
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AddRuleCard
        plugs={plugs.map((p) => ({ serial: p.serial as string, name: p.name }))}
        onCreate={(input) => create.mutate(input)}
        pending={create.isPending}
      />
    </div>
  );
}

function toInput(s: Schedule): ScheduleInput {
  return {
    serial: s.serial,
    label: s.label,
    enabled: s.enabled === 1,
    kind: s.kind,
    action: s.action,
    timeHhmm: s.time_hhmm,
    days: s.days ? s.days.split(",").map(Number) : null,
    priceThreshold: s.price_threshold,
    priceDir: s.price_dir,
    standbyW: s.standby_w,
    standbyMin: s.standby_min,
  };
}

function AddRuleCard({
  plugs,
  onCreate,
  pending,
}: {
  plugs: { serial: string; name: string }[];
  onCreate: (input: ScheduleInput) => void;
  pending: boolean;
}) {
  const [serial, setSerial] = useState("");
  const [kind, setKind] = useState<ScheduleKind>("time");
  const [action, setAction] = useState<"on" | "off">("off");
  const [time, setTime] = useState("22:00");
  const [days, setDays] = useState<number[]>([]);
  const [priceThreshold, setPriceThreshold] = useState(0.15);
  const [priceDir, setPriceDir] = useState<"above" | "below">("below");
  const [standbyW, setStandbyW] = useState(5);
  const [standbyMin, setStandbyMin] = useState(30);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = serial || plugs[0]?.serial;
    if (!chosen) return;
    const base: ScheduleInput = { serial: chosen, kind, enabled: true, action };
    if (kind === "time") onCreate({ ...base, timeHhmm: time, days: days.length ? days : null });
    else if (kind === "price") onCreate({ ...base, priceThreshold, priceDir });
    else onCreate({ ...base, action: "off", standbyW, standbyMin });
  };

  const field = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-accent";

  return (
    <Card title="Add automation" icon="➕">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Device</span>
            <select className={field} value={serial} onChange={(e) => setSerial(e.target.value)}>
              {plugs.map((p) => (
                <option key={p.serial} value={p.serial}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Trigger</span>
            <select className={field} value={kind} onChange={(e) => setKind(e.target.value as ScheduleKind)}>
              <option value="time">At a time</option>
              <option value="price">On energy price</option>
              <option value="standby">Standby (auto-off)</option>
            </select>
          </label>
          {kind !== "standby" && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">Action</span>
              <select className={field} value={action} onChange={(e) => setAction(e.target.value as "on" | "off")}>
                <option value="off">Turn off</option>
                <option value="on">Turn on</option>
              </select>
            </label>
          )}
        </div>

        {kind === "time" && (
          <div className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">Time</span>
              <input type="time" className={`${field} w-40`} value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-1">
              {DAYS.map((d) => (
                <button
                  type="button"
                  key={d.v}
                  onClick={() => setDays((prev) => (prev.includes(d.v) ? prev.filter((x) => x !== d.v) : [...prev, d.v]))}
                  className={`rounded px-2 py-1 text-xs ${
                    days.includes(d.v) ? "bg-accent text-white" : "bg-surface-2 text-muted"
                  }`}
                >
                  {d.l}
                </button>
              ))}
              <span className="self-center pl-2 text-xs text-muted">{days.length ? "" : "every day"}</span>
            </div>
          </div>
        )}

        {kind === "price" && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">When price is</span>
              <select className={field} value={priceDir} onChange={(e) => setPriceDir(e.target.value as "above" | "below")}>
                <option value="below">below</option>
                <option value="above">above</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">€/kWh</span>
              <input
                type="number"
                step="0.01"
                className={`${field} w-32`}
                value={priceThreshold}
                onChange={(e) => setPriceThreshold(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        {kind === "standby" && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">Below (W)</span>
              <input
                type="number"
                className={`${field} w-28`}
                value={standbyW}
                onChange={(e) => setStandbyW(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">For (minutes)</span>
              <input
                type="number"
                className={`${field} w-28`}
                value={standbyMin}
                onChange={(e) => setStandbyMin(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={pending || plugs.length === 0}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add automation"}
        </button>
      </form>
    </Card>
  );
}
