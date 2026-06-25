import { Router } from "express";
import { z } from "zod";
import type { AppContext } from "../app.js";

/** Editable settings — all optional on PUT (partial update). */
const SettingsSchema = z
  .object({
    electricityPriceEurKwh: z.number().nonnegative(),
    gasPriceEurM3: z.number().nonnegative(),
    waterPriceEurM3: z.number().nonnegative(),
    exportFactor: z.number().min(0).max(1),
    plugPriceEurKwh: z.number().nonnegative(),
    alertHighPowerW: z.number().nonnegative(),
    alertBatteryLowSoc: z.number().min(0).max(100),
  })
  .partial();

export function settingsRouter(ctx: AppContext): Router {
  const router = Router();

  router.get("/settings", (_req, res) => {
    res.json({ settings: ctx.settingsRepo.getAll() });
  });

  router.put("/settings", (req, res) => {
    const parsed = SettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid settings", issues: parsed.error.issues });
      return;
    }
    if (Object.keys(parsed.data).length) ctx.settingsRepo.setMany(parsed.data);
    res.json({ settings: ctx.settingsRepo.getAll() });
  });

  return router;
}
