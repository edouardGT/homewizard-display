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
    // Attach serial + live switch state by matching IP against the live device list.
    const live = ctx.sampler.getLive().get();
    const byIp = new Map([...live.devices.values()].map((d) => [d.ip, d]));
    const plugs = ctx.analytics.plugs(range, factors).map((p) => {
      const d = byIp.get(p.ip);
      return {
        ...p,
        serial: d?.serial ?? null,
        online: d?.online ?? false,
        powerOn: (d?.data?.powerOn as boolean | null | undefined) ?? null,
        switchLock: (d?.data?.switchLock as boolean | null | undefined) ?? null,
      };
    });
    res.json({ range, plugs });
  });

  router.get("/plugs/:serial/history", (req, res) => {
    const range = parseRange(req.query.range);
    const factors = costFactors(ctx.settingsRepo.getAll());
    const device = [...ctx.sampler.getLive().get().devices.values()].find(
      (d) => d.serial === req.params.serial
    );
    if (!device || device.type !== "plug") {
      res.status(404).json({ error: "Plug not found" });
      return;
    }
    const series = ctx.analytics.plugSeries(device.ip, range, factors);
    res.json({
      serial: device.serial,
      name: device.name,
      icon: device.icon,
      room: device.room,
      online: device.online,
      powerOn: (device.data?.powerOn as boolean | null | undefined) ?? null,
      switchLock: (device.data?.switchLock as boolean | null | undefined) ?? null,
      range,
      ...series,
    });
  });

  return router;
}
