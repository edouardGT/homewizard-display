import { Router } from "express";
import { z } from "zod";
import type { AppContext } from "../app.js";

const NameSchema = z.object({ name: z.string().trim().min(1).max(80) });

/** GET /api/devices — current devices; PUT /api/devices/:serial — rename. */
export function devicesRouter(ctx: AppContext): Router {
  const router = Router();

  router.get("/devices", (_req, res) => {
    const live = ctx.sampler.getLive().get();
    res.json({ devices: [...live.devices.values()] });
  });

  router.put("/devices/:serial", (req, res) => {
    const serial = req.params.serial;
    if (!serial) {
      res.status(400).json({ error: "Missing serial" });
      return;
    }
    const parsed = NameSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid name", issues: parsed.error.issues });
      return;
    }
    ctx.deviceNamesRepo.set(serial, parsed.data.name);
    res.json({ serial, name: parsed.data.name });
  });

  router.delete("/devices/:serial", (req, res) => {
    ctx.deviceNamesRepo.delete(req.params.serial);
    res.json({ ok: true });
  });

  return router;
}
