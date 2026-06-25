import { getJson, num } from "./httpClient.js";
import type { DeviceConfig, PlugReading, ReadResult } from "./types.js";

interface PlugRaw {
  active_power_w?: number;
  total_power_import_kwh?: number;
  total_power_import_t1_kwh?: number;
  wifi_strength?: number;
}

/** Read a HomeWizard smart plug (v1 HTTP API). */
export async function readPlug(device: DeviceConfig): Promise<ReadResult<PlugReading>> {
  const res = await getJson<PlugRaw>(`http://${device.ip}/api/v1/data`);

  if (!res.online || !res.data) {
    return { online: false, status: res.status, error: res.error };
  }

  const d = res.data;
  const reading: PlugReading = {
    powerW: num(d.active_power_w),
    importKwh: num(d.total_power_import_kwh) ?? num(d.total_power_import_t1_kwh),
    wifiStrength: num(d.wifi_strength),
  };

  return { online: true, status: res.status, data: reading };
}
