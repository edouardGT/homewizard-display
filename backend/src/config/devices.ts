import type { Config } from "./env.js";
import { iconForDeviceName } from "../devices/icon.js";
import type { DeviceConfig } from "../devices/types.js";

/**
 * Build the device list from config. Replaces the old hard-coded DEVICES array
 * and the missing DEVICE_NAMES map (the cause of bug #1). Device metadata
 * (friendly name / room) comes from DEVICE_META_JSON, keyed by IP.
 */
export function buildDevices(config: Config): DeviceConfig[] {
  const meta = config.DEVICE_META_JSON;

  const nameFor = (ip: string, fallback: string) => meta[ip]?.name ?? fallback;
  const roomFor = (ip: string) => meta[ip]?.room ?? null;

  const p1Name = nameFor(config.P1_IP, "P1 Meter");

  const p1: DeviceConfig = {
    name: p1Name,
    type: "p1",
    ip: config.P1_IP,
    api: "v2",
    token: config.P1_TOKEN,
    room: roomFor(config.P1_IP),
    icon: "⚡",
  };

  const plugs: DeviceConfig[] = config.PLUG_IPS.map((ip, i) => {
    const name = nameFor(ip, `Socket ${i + 1}`);
    return {
      name,
      type: "plug" as const,
      ip,
      api: "v1" as const,
      room: roomFor(ip),
      icon: iconForDeviceName(name),
    };
  });

  return [p1, ...plugs];
}
