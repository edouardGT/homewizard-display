import express, { type Express } from "express";
import cors from "cors";
import type { SamplesRepo } from "./db/samples.repo.js";
import type { SettingsRepo } from "./db/settings.repo.js";
import type { RollupsRepo } from "./db/rollups.repo.js";
import type { DeviceNamesRepo } from "./db/deviceNames.repo.js";
import type { DailyRollupRow } from "./db/types.js";
import { Analytics, rangeStart, type Range } from "./services/analytics.js";
import type { Sampler } from "./services/sampler.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { historyRouter } from "./routes/history.js";
import { plugsRouter } from "./routes/plugs.js";
import { settingsRouter } from "./routes/settings.js";
import { healthRouter } from "./routes/health.js";
import { devicesRouter } from "./routes/devices.js";

export interface AppContext {
  sampler: Sampler;
  analytics: Analytics;
  samplesRepo: SamplesRepo;
  settingsRepo: SettingsRepo;
  rollupsRepo: RollupsRepo;
  deviceNamesRepo: DeviceNamesRepo;
  version: string;
  buildAnalytics(range: Range, granularity: "day" | "week" | "month"): AnalyticsResult;
}

export interface AnalyticsSeriesPoint {
  bucket: string;
  importKwh: number;
  exportKwh: number;
  solarKwh: number;
  selfKwh: number;
  grossCostEur: number;
  netCostEur: number;
  exportRevenueEur: number;
  gasM3: number;
  waterM3: number;
}

export interface AnalyticsResult {
  range: Range;
  granularity: "day" | "week" | "month";
  series: AnalyticsSeriesPoint[];
  totals: Omit<AnalyticsSeriesPoint, "bucket">;
}

function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function bucketKey(day: string, granularity: "day" | "week" | "month"): string {
  if (granularity === "day") return day;
  if (granularity === "month") return day.slice(0, 7);
  // week: ISO-ish week label YYYY-Www
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const jan1 = new Date(y, 0, 1);
  const week = Math.ceil(((date.getTime() - jan1.getTime()) / 86_400_000 + jan1.getDay() + 1) / 7);
  return `${y}-W${String(week).padStart(2, "0")}`;
}

/** Build rollup-backed analytics for month/year ranges (fast, O(days)). */
function makeBuildAnalytics(rollupsRepo: RollupsRepo) {
  return (range: Range, granularity: "day" | "week" | "month"): AnalyticsResult => {
    const fromDay = localDay(new Date(rangeStart(range)));
    const toDay = localDay(new Date());
    const rows = rollupsRepo.getBetween(fromDay, toDay);

    const buckets = new Map<string, AnalyticsSeriesPoint>();
    const totals = blankPoint("");

    for (const r of rows) {
      const key = bucketKey(r.day, granularity);
      const point = buckets.get(key) ?? blankPoint(key);
      accumulate(point, r);
      buckets.set(key, point);
      accumulate(totals, r);
    }

    const series = [...buckets.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
    const { bucket: _drop, ...totalsNoBucket } = totals;
    void _drop;
    return { range, granularity, series, totals: totalsNoBucket };
  };
}

function blankPoint(bucket: string): AnalyticsSeriesPoint {
  return {
    bucket,
    importKwh: 0,
    exportKwh: 0,
    solarKwh: 0,
    selfKwh: 0,
    grossCostEur: 0,
    netCostEur: 0,
    exportRevenueEur: 0,
    gasM3: 0,
    waterM3: 0,
  };
}

function accumulate(p: AnalyticsSeriesPoint, r: DailyRollupRow): void {
  p.importKwh += r.import_kwh;
  p.exportKwh += r.export_kwh;
  p.solarKwh += r.solar_kwh;
  p.selfKwh += r.self_kwh;
  p.grossCostEur += r.gross_cost_eur;
  p.netCostEur += r.net_cost_eur;
  p.exportRevenueEur += r.export_revenue_eur;
  p.gasM3 += r.gas_m3;
  p.waterM3 += r.water_m3;
}

export function createApp(
  deps: Omit<AppContext, "buildAnalytics">
): { app: Express; ctx: AppContext } {
  const ctx: AppContext = {
    ...deps,
    buildAnalytics: makeBuildAnalytics(deps.rollupsRepo),
  };

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api", dashboardRouter(ctx));
  app.use("/api", historyRouter(ctx));
  app.use("/api", plugsRouter(ctx));
  app.use("/api", settingsRouter(ctx));
  app.use("/api", healthRouter(ctx));
  app.use("/api", devicesRouter(ctx));

  return { app, ctx };
}
