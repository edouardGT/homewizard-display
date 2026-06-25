import { Router } from "express";
import { z } from "zod";
import type { AppContext } from "../app.js";
import type { ScheduleInput } from "../db/schedules.repo.js";

const ScheduleSchema = z.object({
  serial: z.string().min(1),
  label: z.string().max(80).nullish(),
  enabled: z.boolean().default(true),
  kind: z.enum(["time", "price", "standby"]),
  action: z.enum(["on", "off"]).default("off"),
  timeHhmm: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullish(),
  days: z.array(z.number().int().min(0).max(6)).nullish(),
  priceThreshold: z.number().nullish(),
  priceDir: z.enum(["above", "below"]).nullish(),
  standbyW: z.number().nonnegative().nullish(),
  standbyMin: z.number().int().positive().nullish(),
});

function toInput(b: z.infer<typeof ScheduleSchema>): ScheduleInput {
  return {
    serial: b.serial,
    label: b.label ?? null,
    enabled: b.enabled ? 1 : 0,
    kind: b.kind,
    action: b.action,
    time_hhmm: b.timeHhmm ?? null,
    days: b.days?.length ? b.days.join(",") : null,
    price_threshold: b.priceThreshold ?? null,
    price_dir: b.priceDir ?? null,
    standby_w: b.standbyW ?? null,
    standby_min: b.standbyMin ?? null,
  };
}

export function schedulesRouter(ctx: AppContext): Router {
  const router = Router();

  router.get("/schedules", (_req, res) => {
    res.json({ schedules: ctx.schedulesRepo.list() });
  });

  router.post("/schedules", (req, res) => {
    const parsed = ScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid schedule", issues: parsed.error.issues });
      return;
    }
    res.status(201).json(ctx.schedulesRepo.create(toInput(parsed.data)));
  });

  router.put("/schedules/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!ctx.schedulesRepo.get(id)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const parsed = ScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid schedule", issues: parsed.error.issues });
      return;
    }
    res.json(ctx.schedulesRepo.update(id, toInput(parsed.data)));
  });

  router.delete("/schedules/:id", (req, res) => {
    ctx.schedulesRepo.delete(Number(req.params.id));
    res.json({ ok: true });
  });

  return router;
}
