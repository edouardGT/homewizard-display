import type { SchedulesRepo } from "../db/schedules.repo.js";
import type { ScheduleRow } from "../db/types.js";
import { setPlugState } from "../devices/control.js";
import type { LiveCache, LiveDevice } from "./liveCache.js";

const TICK_MS = 30_000;

/**
 * Evaluates schedules against live data and switches sockets accordingly.
 *  - time:    fire once when local HH:MM (and weekday) matches.
 *  - price:   fire on the transition into the price condition (below/above).
 *  - standby: turn off once power stays below a threshold for N minutes.
 */
export class Scheduler {
  private timer: NodeJS.Timeout | null = null;
  private firedMinute = new Map<number, number>(); // id -> minute epoch
  private priceMet = new Map<number, boolean>(); // id -> last condition state
  private belowSince = new Map<number, number>(); // id -> ts power first dropped
  private standbyFired = new Map<number, boolean>(); // id -> already turned off

  constructor(
    private repo: SchedulesRepo,
    private live: LiveCache
  ) {}

  start(): void {
    this.timer = setInterval(() => void this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private deviceBySerial(serial: string): LiveDevice | undefined {
    return [...this.live.get().devices.values()].find((d) => d.serial === serial);
  }

  async tick(now = Date.now()): Promise<void> {
    const state = this.live.get();
    const d = new Date(now);
    const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const weekday = d.getDay(); // 0 = Sunday
    const minuteEpoch = Math.floor(now / 60_000);
    const price = state.ems?.priceEurKwh ?? null;

    for (const s of this.repo.listEnabled()) {
      try {
        if (s.kind === "time") this.evalTime(s, hhmm, weekday, minuteEpoch);
        else if (s.kind === "price") this.evalPrice(s, price);
        else if (s.kind === "standby") this.evalStandby(s, now);
      } catch (err) {
        console.error(`[scheduler] rule ${s.id} failed`, err);
      }
    }
  }

  private evalTime(s: ScheduleRow, hhmm: string, weekday: number, minuteEpoch: number): void {
    if (s.time_hhmm !== hhmm) return;
    const days = (s.days ?? "").split(",").map((x) => x.trim()).filter(Boolean);
    if (days.length && !days.includes(String(weekday))) return;
    if (this.firedMinute.get(s.id) === minuteEpoch) return; // already fired this minute
    this.firedMinute.set(s.id, minuteEpoch);
    void this.fire(s, s.action);
  }

  private evalPrice(s: ScheduleRow, price: number | null): void {
    if (price === null || s.price_threshold === null) return;
    const met = s.price_dir === "above" ? price > s.price_threshold : price < s.price_threshold;
    const prev = this.priceMet.get(s.id) ?? false;
    this.priceMet.set(s.id, met);
    if (met && !prev) void this.fire(s, s.action); // fire on transition into condition
  }

  private evalStandby(s: ScheduleRow, now: number): void {
    if (s.standby_w === null || s.standby_min === null) return;
    const device = this.deviceBySerial(s.serial);
    const watts = typeof device?.data?.powerW === "number" ? (device.data.powerW as number) : null;
    if (watts === null) return;

    if (watts < s.standby_w) {
      const since = this.belowSince.get(s.id) ?? now;
      this.belowSince.set(s.id, since);
      if (now - since >= s.standby_min * 60_000 && !this.standbyFired.get(s.id)) {
        this.standbyFired.set(s.id, true);
        void this.fire(s, "off");
      }
    } else {
      this.belowSince.delete(s.id);
      this.standbyFired.set(s.id, false);
    }
  }

  private async fire(s: ScheduleRow, action: "on" | "off"): Promise<void> {
    const device = this.deviceBySerial(s.serial);
    if (!device || device.type !== "plug") {
      console.warn(`[scheduler] rule ${s.id}: device ${s.serial} not available`);
      return;
    }
    const res = await setPlugState(device.ip, { power_on: action === "on" });
    console.log(
      `[scheduler] rule ${s.id} (${s.kind}) -> ${action} ${device.name}: ${res.online ? "ok" : "FAILED " + res.error}`
    );
  }
}
