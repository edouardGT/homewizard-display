import cron, { type ScheduledTask } from "node-cron";
import type { SamplesRepo } from "../db/samples.repo.js";
import type { RollupsRepo } from "../db/rollups.repo.js";
import type { SettingsRepo } from "../db/settings.repo.js";
import type { DailyRollupRow } from "../db/types.js";
import { computeUtilityStats } from "./analytics.js";
import { costFactors } from "./costs.js";

/** Local YYYY-MM-DD for a Date. */
function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayBounds(day: string): { start: number; end: number } {
  const [y, m, d] = day.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0).getTime();
  return { start, end };
}

export class RollupService {
  private task: ScheduledTask | null = null;

  constructor(
    private samples: SamplesRepo,
    private rollups: RollupsRepo,
    private settings: SettingsRepo,
    private clampHours: number
  ) {}

  /** Compute and upsert a single day's rollup from raw samples. Idempotent. */
  computeDay(day: string): void {
    const { start, end } = dayBounds(day);
    const rows = this.samples.getSamplesBetween(start, end);
    const factors = costFactors(this.settings.getAll());
    const stats = computeUtilityStats(rows, "day", factors, this.clampHours);

    const row: DailyRollupRow = {
      day,
      import_kwh: stats.electricity.gridImportKwh,
      export_kwh: stats.electricity.gridExportKwh,
      solar_kwh: stats.solar.productionKwh,
      self_kwh: stats.solar.selfConsumedKwh,
      battery_charge_kwh: stats.battery.chargedKwh,
      battery_discharge_kwh: stats.battery.dischargedKwh,
      gross_cost_eur: stats.finance.grossElectricityCostEur,
      net_cost_eur: stats.finance.netElectricityCostEur,
      export_revenue_eur: stats.finance.exportRevenueEur,
      gas_m3: stats.gas.usedM3,
      water_m3: stats.water.usedM3,
      min_soc: stats.battery.minSoc,
      max_soc: stats.battery.maxSoc,
    };
    this.rollups.upsert(row);
  }

  /** On boot: fill any missing daily rollups between the first sample and yesterday. */
  backfill(now = new Date()): void {
    const firstTs = this.samples.getFirstSampleTs();
    if (firstTs === null) return;

    const existing = this.rollups.getExistingDays();
    const cursor = new Date(firstTs);
    cursor.setHours(0, 0, 0, 0);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    let filled = 0;
    while (cursor.getTime() <= yesterday.getTime()) {
      const day = localDay(cursor);
      if (!existing.has(day)) {
        this.computeDay(day);
        filled++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (filled) console.log(`[rollups] backfilled ${filled} day(s)`);
  }

  /** Schedule the nightly job (~00:05 local) to finalize yesterday. */
  start(): void {
    this.task = cron.schedule("5 0 * * *", () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      this.computeDay(localDay(y));
      console.log(`[rollups] finalized ${localDay(y)}`);
    });
  }

  stop(): void {
    this.task?.stop();
  }
}
