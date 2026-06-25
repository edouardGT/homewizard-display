import type { SamplesRepo } from "../db/samples.repo.js";
import type { SampleRow, PlugSampleRow } from "../db/types.js";
import {
  type CostFactors,
  electricityCost,
  exportRevenue,
  gasCost,
  plugCost,
  solarSaving,
  waterCost,
} from "./costs.js";

export type Range = "day" | "week" | "month" | "year";

/** Start-of-range timestamp (local time), ported from the old db.js. */
export function rangeStart(range: Range, now = new Date()): number {
  const start = new Date(now);
  if (range === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  } else if (range === "month") {
    start.setDate(1);
  } else if (range === "year") {
    start.setMonth(0, 1);
  }
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export interface UtilityStats {
  range: Range;
  points: {
    ts: number;
    time: string;
    gridPowerW: number | null;
    pvPowerW: number | null;
    batteryPowerW: number | null;
    batterySoc: number | null;
    gasM3: number | null;
    waterM3: number | null;
    priceEurKwh: number | null;
  }[];
  electricity: { gridImportKwh: number; gridExportKwh: number };
  solar: { productionKwh: number; selfConsumedKwh: number; selfConsumptionPct: number };
  battery: {
    minSoc: number | null;
    maxSoc: number | null;
    chargedKwh: number;
    dischargedKwh: number;
  };
  gas: { usedM3: number; estimatedCostEur: number };
  water: { usedM3: number; estimatedCostEur: number };
  finance: {
    grossElectricityCostEur: number;
    solarSavingEur: number;
    exportRevenueEur: number;
    netElectricityCostEur: number;
    totalUtilityCostEur: number;
  };
}

const EMPTY = (range: Range): UtilityStats => ({
  range,
  points: [],
  electricity: { gridImportKwh: 0, gridExportKwh: 0 },
  solar: { productionKwh: 0, selfConsumedKwh: 0, selfConsumptionPct: 0 },
  battery: { minSoc: null, maxSoc: null, chargedKwh: 0, dischargedKwh: 0 },
  gas: { usedM3: 0, estimatedCostEur: 0 },
  water: { usedM3: 0, estimatedCostEur: 0 },
  finance: {
    grossElectricityCostEur: 0,
    solarSavingEur: 0,
    exportRevenueEur: 0,
    netElectricityCostEur: 0,
    totalUtilityCostEur: 0,
  },
});

/**
 * Integrate a series of power samples into energy/cost stats.
 * `clampHours` bounds the per-interval gap so an offline period can't be
 * counted as continuous power. It should track the sample rate
 * (~2.5 × interval), NOT a hard-coded constant.
 */
export function computeUtilityStats(
  rows: SampleRow[],
  range: Range,
  factors: CostFactors,
  clampHours: number
): UtilityStats {
  if (rows.length < 2) return EMPTY(range);

  let gridImportKwh = 0;
  let gridExportKwh = 0;
  let solarKwh = 0;
  let batteryChargeKwh = 0;
  let batteryDischargeKwh = 0;
  let grossCost = 0;
  let exportRev = 0;
  let minSoc: number | null = null;
  let maxSoc: number | null = null;

  const first = rows[0];
  const last = rows[rows.length - 1];

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const cur = rows[i];
    const hours = Math.max(0, Math.min((cur.ts - prev.ts) / 3_600_000, clampHours));
    const price = cur.price_eur_kwh ?? factors.electricityPriceEurKwh;

    const gridW = cur.grid_power_w ?? 0;
    const pvW = Math.max(cur.pv_power_w ?? 0, 0);
    const battW = cur.battery_power_w ?? 0;

    const importKwh = (Math.max(gridW, 0) / 1000) * hours;
    const exportKwh = (Math.max(-gridW, 0) / 1000) * hours;

    gridImportKwh += importKwh;
    gridExportKwh += exportKwh;
    solarKwh += (pvW / 1000) * hours;

    if (battW > 0) batteryDischargeKwh += (battW / 1000) * hours;
    if (battW < 0) batteryChargeKwh += (Math.abs(battW) / 1000) * hours;

    grossCost += electricityCost(importKwh, price);
    exportRev += exportRevenue(exportKwh, price, factors);

    if (typeof cur.battery_soc === "number") {
      minSoc = minSoc === null ? cur.battery_soc : Math.min(minSoc, cur.battery_soc);
      maxSoc = maxSoc === null ? cur.battery_soc : Math.max(maxSoc, cur.battery_soc);
    }
  }

  // Cumulative counters: prefer first→last delta (more accurate than integration).
  const gasUsedM3 =
    typeof first.gas_m3 === "number" && typeof last.gas_m3 === "number"
      ? Math.max(last.gas_m3 - first.gas_m3, 0)
      : 0;
  const waterUsedM3 =
    typeof first.water_m3 === "number" && typeof last.water_m3 === "number"
      ? Math.max(last.water_m3 - first.water_m3, 0)
      : 0;

  const lastPrice = last.price_eur_kwh ?? factors.electricityPriceEurKwh;
  const selfConsumedKwh = Math.max(solarKwh - gridExportKwh, 0);
  const selfConsumptionPct = solarKwh > 0 ? (selfConsumedKwh / solarKwh) * 100 : 0;
  const solarSavingEur = solarSaving(selfConsumedKwh, lastPrice);
  const gasCostEur = gasCost(gasUsedM3, factors);
  const waterCostEur = waterCost(waterUsedM3, factors);
  const netElectricity = Math.max(grossCost - solarSavingEur - exportRev, 0);

  return {
    range,
    points: rows.map((r) => ({
      ts: r.ts,
      time: new Date(r.ts).toISOString(),
      gridPowerW: r.grid_power_w,
      pvPowerW: r.pv_power_w,
      batteryPowerW: r.battery_power_w,
      batterySoc: r.battery_soc,
      gasM3: r.gas_m3,
      waterM3: r.water_m3,
      priceEurKwh: r.price_eur_kwh,
    })),
    electricity: { gridImportKwh, gridExportKwh },
    solar: { productionKwh: solarKwh, selfConsumedKwh, selfConsumptionPct },
    battery: { minSoc, maxSoc, chargedKwh: batteryChargeKwh, dischargedKwh: batteryDischargeKwh },
    gas: { usedM3: gasUsedM3, estimatedCostEur: gasCostEur },
    water: { usedM3: waterUsedM3, estimatedCostEur: waterCostEur },
    finance: {
      grossElectricityCostEur: grossCost,
      solarSavingEur,
      exportRevenueEur: exportRev,
      netElectricityCostEur: netElectricity,
      totalUtilityCostEur: netElectricity + gasCostEur + waterCostEur,
    },
  };
}

export interface PlugStat {
  ip: string;
  name: string;
  room: string | null;
  icon: string | null;
  currentPowerW: number | null;
  energyKwh: number;
  estimatedCostEur: number;
  wifiStrength: number | null;
}

export function computePlugStats(
  rows: PlugSampleRow[],
  factors: CostFactors,
  clampHours: number
): PlugStat[] {
  const byIp = new Map<string, PlugSampleRow[]>();
  for (const row of rows) {
    if (!byIp.has(row.ip)) byIp.set(row.ip, []);
    byIp.get(row.ip)!.push(row);
  }

  const result: PlugStat[] = [];
  for (const [ip, samples] of byIp.entries()) {
    if (samples.length < 2) continue;
    let kwh = 0;
    for (let i = 1; i < samples.length; i++) {
      const hours = Math.max(0, Math.min((samples[i].ts - samples[i - 1].ts) / 3_600_000, clampHours));
      kwh += (Math.max(samples[i].power_w ?? 0, 0) / 1000) * hours;
    }
    const last = samples[samples.length - 1];
    result.push({
      ip,
      name: last.name,
      room: last.room,
      icon: last.icon,
      currentPowerW: last.power_w,
      energyKwh: kwh,
      estimatedCostEur: plugCost(kwh, factors),
      wifiStrength: last.wifi_strength,
    });
  }

  return result.sort((a, b) => b.estimatedCostEur - a.estimatedCostEur);
}

export interface PlugSeries {
  points: { ts: number; powerW: number | null }[];
  energyKwh: number;
  estimatedCostEur: number;
  currentPowerW: number | null;
  peakPowerW: number | null;
  avgPowerW: number | null;
}

/** Power-over-time + energy/cost for a single plug. */
export function computePlugSeries(
  rows: PlugSampleRow[],
  factors: CostFactors,
  clampHours: number
): PlugSeries {
  const points = rows.map((r) => ({ ts: r.ts, powerW: r.power_w }));
  let kwh = 0;
  let peak: number | null = null;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    const w = rows[i].power_w;
    if (typeof w === "number") {
      peak = peak === null ? w : Math.max(peak, w);
      sum += w;
      count++;
    }
    if (i > 0) {
      const hours = Math.max(0, Math.min((rows[i].ts - rows[i - 1].ts) / 3_600_000, clampHours));
      kwh += (Math.max(rows[i].power_w ?? 0, 0) / 1000) * hours;
    }
  }
  return {
    points,
    energyKwh: kwh,
    estimatedCostEur: plugCost(kwh, factors),
    currentPowerW: rows.length ? rows[rows.length - 1].power_w : null,
    peakPowerW: peak,
    avgPowerW: count ? sum / count : null,
  };
}

/** Convenience wrappers binding a repo + clamp. */
export class Analytics {
  constructor(
    private repo: SamplesRepo,
    private clampHours: number
  ) {}

  utility(range: Range, factors: CostFactors): UtilityStats {
    const rows = this.repo.getSamplesSince(rangeStart(range));
    return computeUtilityStats(rows, range, factors, this.clampHours);
  }

  plugs(range: Range, factors: CostFactors): PlugStat[] {
    const rows = this.repo.getPlugSamplesSince(rangeStart(range));
    return computePlugStats(rows, factors, this.clampHours);
  }

  plugSeries(ip: string, range: Range, factors: CostFactors): PlugSeries {
    const rows = this.repo.getPlugSamplesByIpSince(ip, rangeStart(range));
    return computePlugSeries(rows, factors, this.clampHours);
  }
}
