import type { SettingsMap } from "../db/settings.repo.js";
import type { LiveState } from "./liveCache.js";

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  since: number;
}

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/**
 * Evaluate alert conditions after each poll. High-power and device-offline
 * conditions are debounced (must persist N consecutive ticks) to avoid noise.
 */
export class AlertEngine {
  private active = new Map<string, Alert>();
  private highPowerStreak = 0;
  private p1OfflineStreak = 0;
  private readonly debounceTicks: number;

  constructor(debounceTicks = 3) {
    this.debounceTicks = debounceTicks;
  }

  evaluate(state: LiveState, settings: SettingsMap, now: number): Alert[] {
    const highPowerW = num(settings.alertHighPowerW, 7000);
    const lowSoc = num(settings.alertBatteryLowSoc, 15);

    // High grid power (sustained).
    const gridW = state.p1?.powerW ?? 0;
    if (state.p1Online && gridW > highPowerW) {
      this.highPowerStreak++;
      if (this.highPowerStreak >= this.debounceTicks) {
        this.raise({
          id: "high-power",
          severity: "warning",
          title: "High power draw",
          message: `Grid power is ${Math.round(gridW)} W (threshold ${highPowerW} W).`,
          since: now,
        });
      }
    } else {
      this.highPowerStreak = 0;
      this.clear("high-power");
    }

    // Battery low SoC.
    const soc = state.ems?.batterySoc;
    if (typeof soc === "number" && soc < lowSoc) {
      this.raise({
        id: "battery-low",
        severity: "warning",
        title: "Battery low",
        message: `Battery at ${Math.round(soc)}% (threshold ${lowSoc}%).`,
        since: now,
      });
    } else {
      this.clear("battery-low");
    }

    // P1 meter offline (sustained).
    if (!state.p1Online) {
      this.p1OfflineStreak++;
      if (this.p1OfflineStreak >= this.debounceTicks) {
        this.raise({
          id: "p1-offline",
          severity: "critical",
          title: "P1 meter offline",
          message: "The P1 meter has been unreachable.",
          since: now,
        });
      }
    } else {
      this.p1OfflineStreak = 0;
      this.clear("p1-offline");
    }

    return this.list();
  }

  list(): Alert[] {
    return [...this.active.values()].sort((a, b) => a.since - b.since);
  }

  private raise(alert: Alert): void {
    const existing = this.active.get(alert.id);
    // Preserve the original `since` timestamp while the alert stays active.
    this.active.set(alert.id, existing ? { ...alert, since: existing.since } : alert);
  }

  private clear(id: string): void {
    this.active.delete(id);
  }
}
