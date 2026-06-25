import { Router } from "express";
import type { AppContext } from "../app.js";
import { type Range } from "../services/analytics.js";
import { costFactors } from "../services/costs.js";

const RANGES: Range[] = ["day", "week", "month", "year"];
const parseRange = (v: unknown): Range => (RANGES.includes(v as Range) ? (v as Range) : "day");

/** GET /api/plugs?range= — per-plug energy + cost, sorted by cost. */
export function plugsRouter(ctx: AppContext): Router {
  const router = Router();

  router.get("/plugs", (req, res) => {
    const range = parseRange(req.query.range);
    const factors = costFactors(ctx.settingsRepo.getAll());
    // Attach serial (rename key) by matching IP against the live device list.
    const live = ctx.sampler.getLive().get();
    const ipToSerial = new Map([...live.devices.values()].map((d) => [d.ip, d.serial]));
    const plugs = ctx.analytics
      .plugs(range, factors)
      .map((p) => ({ ...p, serial: ipToSerial.get(p.ip) ?? null }));
    res.json({ range, plugs });
  });

  return router;
}
