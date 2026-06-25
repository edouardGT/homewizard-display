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
    res.json({ range, plugs: ctx.analytics.plugs(range, factors) });
  });

  return router;
}
