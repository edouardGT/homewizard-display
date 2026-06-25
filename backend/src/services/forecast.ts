import type { RollupsRepo } from "../db/rollups.repo.js";
import type { Analytics } from "./analytics.js";
import type { SettingsRepo } from "../db/settings.repo.js";
import { costFactors } from "./costs.js";

export interface Forecast {
  month: string;
  daysElapsed: number;
  daysInMonth: number;
  monthToDate: { netCostEur: number; importKwh: number };
  projectedMonth: { netCostEur: number; importKwh: number };
  perDayAvgEur: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Month-to-date totals (finalized daily rollups + today's live total) projected
 * linearly to a month-end estimate. Rough early in the month; sharpens as data
 * accumulates.
 */
export function computeForecast(
  rollups: RollupsRepo,
  analytics: Analytics,
  settings: SettingsRepo,
  now = new Date()
): Forecast {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthKey = `${y}-${pad(m + 1)}`;

  // Finalized days this month: from the 1st up to yesterday.
  const firstDay = `${monthKey}-01`;
  const yesterday = new Date(y, m, dayOfMonth - 1);
  const lastFinalized = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

  let net = 0;
  let importKwh = 0;
  if (dayOfMonth > 1) {
    for (const r of rollups.getBetween(firstDay, lastFinalized)) {
      net += r.net_cost_eur;
      importKwh += r.import_kwh;
    }
  }

  // Today (live, partial).
  const today = analytics.utility("day", costFactors(settings.getAll()));
  net += today.finance.netElectricityCostEur;
  importKwh += today.electricity.gridImportKwh;

  const perDayAvgEur = dayOfMonth > 0 ? net / dayOfMonth : 0;
  const perDayAvgImport = dayOfMonth > 0 ? importKwh / dayOfMonth : 0;

  return {
    month: monthKey,
    daysElapsed: dayOfMonth,
    daysInMonth,
    monthToDate: { netCostEur: net, importKwh },
    projectedMonth: {
      netCostEur: perDayAvgEur * daysInMonth,
      importKwh: perDayAvgImport * daysInMonth,
    },
    perDayAvgEur,
  };
}
