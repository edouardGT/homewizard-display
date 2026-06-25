import { useState } from "react";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import { Card } from "../components/ui/Card";
import { Loading } from "../components/ui/Loading";
import { ErrorBanner } from "../components/layout/ErrorBanner";
import type { Settings } from "../types/api";

const FIELDS: { key: keyof Settings; label: string; step: number }[] = [
  { key: "electricityPriceEurKwh", label: "Electricity price (€/kWh)", step: 0.01 },
  { key: "gasPriceEurM3", label: "Gas price (€/m³)", step: 0.01 },
  { key: "waterPriceEurM3", label: "Water price (€/m³)", step: 0.01 },
  { key: "exportFactor", label: "Export price factor (0–1)", step: 0.05 },
  { key: "plugPriceEurKwh", label: "Plug price (€/kWh)", step: 0.01 },
  { key: "alertHighPowerW", label: "High-power alert (W)", step: 100 },
  { key: "alertBatteryLowSoc", label: "Battery low alert (%)", step: 1 },
];

export function SettingsPage() {
  const { data, isLoading, isError } = useSettings();
  const update = useUpdateSettings();
  // Hold only the user's edits; merge with loaded settings for display. This
  // avoids syncing server state into local state via an effect.
  const [edits, setEdits] = useState<Partial<Settings>>({});

  if (isLoading) return <Loading />;
  if (isError || !data) return <ErrorBanner message="Could not load settings." />;

  const settings = data.settings;
  const valueFor = (key: keyof Settings) => edits[key] ?? settings[key];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(edits).length) update.mutate(edits, { onSuccess: () => setEdits({}) });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <Card title="Prices &amp; Alerts" icon="⚙️">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-1">
                <span className="text-xs text-muted">{f.label}</span>
                <input
                  type="number"
                  step={f.step}
                  value={valueFor(f.key) ?? ""}
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))
                  }
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-accent"
                />
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={update.isPending || Object.keys(edits).length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {update.isPending ? "Saving…" : "Save settings"}
            </button>
            {update.isSuccess && Object.keys(edits).length === 0 && (
              <span className="text-sm text-[var(--color-positive)]">Saved ✓</span>
            )}
            {update.isError && <span className="text-sm text-[var(--color-negative)]">Failed to save</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
