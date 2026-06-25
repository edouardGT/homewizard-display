import { Router } from "express";
import type { AppContext } from "../app.js";

/** GET /api/health — liveness + data freshness + device status. GET /api/alerts. */
export function healthRouter(ctx: AppContext): Router {
  const router = Router();
  const startedAt = Date.now();

  router.get("/health", (_req, res) => {
    const live = ctx.sampler.getLive().get();
    const devices = [...live.devices.values()];
    const lastSampleTs = ctx.samplesRepo.getLastSampleTs();

    res.json({
      status: "ok",
      uptimeS: Math.round((Date.now() - startedAt) / 1000),
      lastSampleTs,
      sampleAgeS: lastSampleTs ? Math.round((Date.now() - lastSampleTs) / 1000) : null,
      sampleCount: ctx.samplesRepo.countSamples(),
      dbOk: true,
      devices: {
        online: devices.filter((d) => d.online).length,
        total: devices.length,
      },
      version: ctx.version,
    });
  });

  router.get("/alerts", (_req, res) => {
    res.json({ alerts: ctx.sampler.getAlerts() });
  });

  return router;
}
