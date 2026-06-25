import type { Config } from "./env.js";
import { iconForDeviceName } from "../devices/icon.js";
import { readDeviceInfo } from "../devices/info.js";
import type { DeviceConfig } from "../devices/types.js";

/**
 * Build the device list from config. Replaces the old hard-coded DEVICES array
 * and the missing DEVICE_NAMES map (the cause of bug #1). Device metadata
 * (friendly name / room) comes from DEVICE_META_JSON, keyed by IP or serial.
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

  const plugs: DeviceConfig[] = config.PLUG_IPS.map((ip) => ({
    // Temporary name; replaced by enrichPlugNames() once serials are fetched.
    name: meta[ip]?.name ?? "Socket",
    type: "plug" as const,
    ip,
    api: "v1" as const,
    room: roomFor(ip),
    icon: iconForDeviceName(meta[ip]?.name ?? "Socket"),
  }));

  return [p1, ...plugs];
}

/**
 * Fetch each plug's serial and assign a stable name + icon. Precedence:
 *   DEVICE_META_JSON[ip].name  >  DEVICE_META_JSON[serial].name  >  "Socket <SERIAL-SUFFIX>"
 * The user-assigned (app) name is not available on the LAN, so a friendly name
 * must come from DEVICE_META_JSON; the icon is derived from whatever name wins.
 */
/**
 * Resolve the display name + icon for a device, applying a customer-assigned
 * name (by serial) if one exists. Icon is always derived from the final name,
 * except we keep a device's built-in icon (e.g. P1 ⚡) when no custom name set.
 */
export function resolveDeviceName(
  device: DeviceConfig,
  customNames: Map<string, string>
): { name: string; icon: string } {
  const custom = device.serial ? customNames.get(device.serial) : undefined;
  if (custom) return { name: custom, icon: iconForDeviceName(custom) };
  return { name: device.name, icon: device.icon };
}

export async function enrichPlugNames(devices: DeviceConfig[], config: Config): Promise<void> {
  const meta = config.DEVICE_META_JSON;
  const plugs = devices.filter((d) => d.type === "plug");

  await Promise.all(
    plugs.map(async (d) => {
      const info = await readDeviceInfo(d.ip);
      if (info.serial) d.serial = info.serial;

      const suffix = info.serial ? info.serial.slice(-6).toUpperCase() : null;
      const metaEntry = meta[d.ip] ?? (info.serial ? meta[info.serial] : undefined);

      d.name = metaEntry?.name ?? (suffix ? `Socket ${suffix}` : d.name);
      d.room = metaEntry?.room ?? d.room ?? null;
      d.icon = iconForDeviceName(d.name);
    })
  );
}
