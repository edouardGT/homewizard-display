import { Router } from "express";
import type { AppContext } from "../app.js";
import { type Range } from "../services/analytics.js";
import { costFactors } from "../services/costs.js";
import { computeForecast } from "../services/forecast.js";

const RANGES: Range[] = ["day", "week", "month", "year"];
const parseRange = (v: unknown): Range => (RANGES.includes(v as Range) ? (v as Range) : "day");

/** GET /api/history?range= and GET /api/analytics?range=&granularity= */
export function historyRouter(ctx: AppContext): Router {
  const router = Router();

  router.get("/history", (req, res) => {
    const range = parseRange(req.query.range);
    const factors = costFactors(ctx.settingsRepo.getAll());
    res.json(ctx.analytics.utility(range, factors));
  });

  router.get("/analytics", (req, res) => {
    const range = parseRange(req.query.range);
    const granularity =
      req.query.granularity === "week" || req.query.granularity === "month"
        ? (req.query.granularity as "week" | "month")
        : "day";
    res.json(ctx.buildAnalytics(range, granularity));
  });

  router.get("/forecast", (_req, res) => {
    res.json(computeForecast(ctx.rollupsRepo, ctx.analytics, ctx.settingsRepo));
  });

  return router;
}
