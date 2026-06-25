import type { SettingsMap } from "../db/settings.repo.js";

/**
 * Pure cost math. All factors come from the settings table (seeded from env),
 * so prices are user-editable at runtime without a redeploy.
 */
export interface CostFactors {
  electricityPriceEurKwh: number;
  gasPriceEurM3: number;
  waterPriceEurM3: number;
  exportFactor: number;
  plugPriceEurKwh: number;
}

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

export function costFactors(settings: SettingsMap): CostFactors {
  return {
    electricityPriceEurKwh: num(settings.electricityPriceEurKwh, 0.3),
    gasPriceEurM3: num(settings.gasPriceEurM3, 1.15),
    waterPriceEurM3: num(settings.waterPriceEurM3, 5.2),
    exportFactor: num(settings.exportFactor, 0.65),
    plugPriceEurKwh: num(settings.plugPriceEurKwh, 0.3),
  };
}

export const electricityCost = (kwh: number, priceEurKwh: number): number => kwh * priceEurKwh;
export const gasCost = (m3: number, f: CostFactors): number => m3 * f.gasPriceEurM3;
export const waterCost = (m3: number, f: CostFactors): number => m3 * f.waterPriceEurM3;
export const exportRevenue = (kwh: number, priceEurKwh: number, f: CostFactors): number =>
  kwh * priceEurKwh * f.exportFactor;
export const solarSaving = (kwh: number, priceEurKwh: number): number => kwh * priceEurKwh;
export const plugCost = (kwh: number, f: CostFactors): number => kwh * f.plugPriceEurKwh;
