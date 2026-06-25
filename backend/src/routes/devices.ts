import { Router } from "express";
import { z } from "zod";
import type { AppContext } from "../app.js";
import { setPlugState } from "../devices/control.js";

const NameSchema = z.object({ name: z.string().trim().min(1).max(80) });
const PowerSchema = z.object({ on: z.boolean() });
const LockSchema = z.object({ locked: z.boolean() });

/** Find the live device (and its IP) for a serial. */
function findBySerial(ctx: AppContext, serial: string) {
  return [...ctx.sampler.getLive().get().devices.values()].find((d) => d.serial === serial);
}

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

  router.put("/devices/:serial/power", async (req, res) => {
    const parsed = PowerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Body must be { on: boolean }" });
      return;
    }
    const device = findBySerial(ctx, req.params.serial);
    if (!device || device.type !== "plug") {
      res.status(404).json({ error: "Plug not found" });
      return;
    }
    const result = await setPlugState(device.ip, { power_on: parsed.data.on });
    if (!result.online) {
      res.status(502).json({ error: result.error ?? "Device unreachable" });
      return;
    }
    res.json({ serial: req.params.serial, state: result.data });
  });

  router.put("/devices/:serial/lock", async (req, res) => {
    const parsed = LockSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Body must be { locked: boolean }" });
      return;
    }
    const device = findBySerial(ctx, req.params.serial);
    if (!device || device.type !== "plug") {
      res.status(404).json({ error: "Plug not found" });
      return;
    }
    const result = await setPlugState(device.ip, { switch_lock: parsed.data.locked });
    if (!result.online) {
      res.status(502).json({ error: result.error ?? "Device unreachable" });
      return;
    }
    res.json({ serial: req.params.serial, state: result.data });
  });

  return router;
}
