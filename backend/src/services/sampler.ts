import type { Config } from "../config/env.js";
import type { DeviceConfig } from "../devices/types.js";
import { readP1 } from "../devices/p1.js";
import { readPlug } from "../devices/plug.js";
import { readPlugState } from "../devices/control.js";
import { readEms } from "../devices/ems.js";
import type { SamplesRepo } from "../db/samples.repo.js";
import type { SettingsRepo } from "../db/settings.repo.js";
import type { DeviceNamesRepo } from "../db/deviceNames.repo.js";
import type { PlugSampleInsert } from "../db/types.js";
import { resolveDeviceName } from "../config/devices.js";
import { LiveCache, type LiveDevice } from "./liveCache.js";
import { AlertEngine, type Alert } from "./alerts.js";

export interface Sampler {
  stop(): void;
  getLive(): LiveCache;
  getAlerts(): Alert[];
}

interface SamplerDeps {
  config: Config;
  devices: DeviceConfig[];
  samplesRepo: SamplesRepo;
  settingsRepo: SettingsRepo;
  deviceNamesRepo: DeviceNamesRepo;
}

/**
 * Recurring poll loop. Uses a self-rescheduling setTimeout (not setInterval) so
 * a slow poll never stacks. Writes raw instantaneous values + cumulative
 * counters; energy integration happens only at read time (analytics.ts), which
 * is the fix for the old in-request accumulation bugs.
 */
export function startSampler(deps: SamplerDeps): Sampler {
  const { config, devices, samplesRepo, settingsRepo, deviceNamesRepo } = deps;
  const live = new LiveCache();
  const alerts = new AlertEngine();

  const p1Device = devices.find((d) => d.type === "p1")!;
  const plugDevices = devices.filter((d) => d.type === "plug");

  let timer: NodeJS.Timeout | null = null;
  let stopped = false;
  let p1WasOnline = true;

  async function pollOnce(): Promise<void> {
    const ts = Date.now();
    const customNames = deviceNamesRepo.getAll();

    const [p1Res, emsRes, ...plugResults] = await Promise.all([
      readP1(p1Device),
      readEms(config.EMS_URL),
      ...plugDevices.map((d) =>
        Promise.all([readPlug(d), readPlugState(d.ip)]).then(([r, s]) => ({ device: d, r, s }))
      ),
    ]);

    // --- P1 ---
    live.updateP1(p1Res.data ?? null, p1Res.online);
    const p1Resolved = resolveDeviceName(p1Device, customNames);
    live.upsertDevice(toLiveDevice(p1Device, p1Resolved, p1Res.online, p1Res.status, p1Res.error, p1Res.data));
    if (p1Res.online !== p1WasOnline) {
      console.log(`[sampler] P1 meter ${p1Res.online ? "online" : "offline"}`);
      p1WasOnline = p1Res.online;
    }

    // --- EMS ---
    live.updateEms(emsRes.data ?? null, emsRes.online);

    // --- Plugs ---
    live.setPlugReadings(
      plugResults.map(({ device, r }) => ({ ip: device.ip, reading: r.data ?? null, online: r.online }))
    );
    for (const { device, r, s } of plugResults) {
      const resolved = resolveDeviceName(device, customNames);
      const merged = {
        ...(r.data ?? {}),
        powerOn: s.data?.powerOn ?? null,
        switchLock: s.data?.switchLock ?? null,
      };
      live.upsertDevice(toLiveDevice(device, resolved, r.online, r.status, r.error, merged));
    }

    live.commit(ts);

    // --- Persist ---
    if (p1Res.online && p1Res.data) {
      const p1 = p1Res.data;
      const ems = emsRes.online ? emsRes.data : null;
      try {
        samplesRepo.insertSample({
          ts,
          gridPowerW: p1.powerW,
          pvPowerW: ems?.pvPowerW ?? null,
          batteryPowerW: ems?.batteryPowerW ?? null,
          batterySoc: ems?.batterySoc ?? null,
          priceEurKwh: ems?.priceEurKwh ?? null,
          importKwh: p1.importKwh,
          exportKwh: p1.exportKwh,
          gasM3: p1.gasM3,
          waterM3: p1.waterM3,
        });
      } catch (err) {
        console.error("[sampler] failed to insert sample", err);
      }
    }

    const plugRows: PlugSampleInsert[] = [];
    for (const { device, r } of plugResults) {
      if (r.online && r.data) {
        const resolved = resolveDeviceName(device, customNames);
        plugRows.push({
          ts,
          ip: device.ip,
          name: resolved.name,
          room: device.room ?? null,
          icon: resolved.icon,
          powerW: r.data.powerW,
          importKwh: r.data.importKwh,
          wifiStrength: r.data.wifiStrength,
        });
      }
    }
    if (plugRows.length) {
      try {
        samplesRepo.insertPlugSamples(plugRows);
      } catch (err) {
        console.error("[sampler] failed to insert plug samples", err);
      }
    }

    // --- Alerts ---
    alerts.evaluate(live.get(), settingsRepo.getAll(), ts);
  }

  async function tick(): Promise<void> {
    if (stopped) return;
    try {
      await pollOnce();
    } catch (err) {
      console.error("[sampler] poll failed", err);
    }
    if (!stopped) timer = setTimeout(tick, config.SAMPLE_INTERVAL_MS);
  }

  // Kick off immediately.
  void tick();

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
    getLive: () => live,
    getAlerts: () => alerts.list(),
  };
}

function toLiveDevice(
  device: DeviceConfig,
  resolved: { name: string; icon: string },
  online: boolean,
  status: number | undefined,
  error: string | undefined,
  data: unknown
): LiveDevice {
  return {
    name: resolved.name,
    type: device.type as "p1" | "plug",
    ip: device.ip,
    api: device.api,
    icon: resolved.icon,
    serial: device.serial ?? null,
    room: device.room ?? null,
    online,
    status,
    lastSeenTs: online ? Date.now() : null,
    error,
    data: (data as Record<string, unknown>) ?? {},
  };
}
