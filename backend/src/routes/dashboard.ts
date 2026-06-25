import { Router } from "express";
import type { AppContext } from "../app.js";
import { costFactors } from "../services/costs.js";

/** GET /api/dashboard — live snapshot + today's running totals (from the DB). */
export function dashboardRouter(ctx: AppContext): Router {
  const router = Router();

  router.get("/dashboard", (_req, res) => {
    const live = ctx.sampler.getLive().get();
    const p1 = live.p1;
    const ems = live.ems;
    const factors = costFactors(ctx.settingsRepo.getAll());

    const today = ctx.analytics.utility("day", factors);
    const actualPrice = ems?.priceEurKwh ?? factors.electricityPriceEurKwh;

    const devices = [...live.devices.values()];

    res.json({
      updatedAt: new Date(live.ts || Date.now()).toISOString(),
      devices,
      summary: {
        powerW: p1?.powerW ?? null,
        powerL1W: p1?.powerL1W ?? null,
        powerL2W: p1?.powerL2W ?? null,
        powerL3W: p1?.powerL3W ?? null,
        currentA: p1?.currentA ?? null,
        averagePower15mW: p1?.averagePower15mW ?? null,
        monthlyPeakW: p1?.monthlyPeakW ?? null,
        importKwh: p1?.importKwh ?? null,
        exportKwh: p1?.exportKwh ?? null,
        gasM3: p1?.gasM3 ?? null,
        waterM3: p1?.waterM3 ?? null,
        plugTotalW: live.plugTotalW,
        tariff: p1?.tariff ?? null,
        meterModel: p1?.meterModel ?? null,
        timestamp: p1?.timestamp ?? null,
        actualPriceEurKwh: actualPrice,
        pvPowerW: ems?.pvPowerW ?? null,
        batteryPowerW: ems?.batteryPowerW ?? null,
        batterySoc: ems?.batterySoc ?? null,
        todayGrossCostEur: today.finance.grossElectricityCostEur,
        todaySolarBatterySavingEur: today.finance.solarSavingEur,
        todayNetSpendEur: today.finance.netElectricityCostEur,
        todayGridImportKwh: today.electricity.gridImportKwh,
        todaySelfKwh: today.solar.selfConsumedKwh,
      },
    });
  });

  return router;
}
