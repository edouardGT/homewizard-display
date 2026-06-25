import { getJson, num } from "./httpClient.js";
import type { DeviceConfig, P1Reading, ReadResult } from "./types.js";

interface P1External {
  type?: string;
  value?: number;
}

interface P1Raw {
  power_w?: number;
  active_power_w?: number;
  power_l1_w?: number;
  active_power_l1_w?: number;
  power_l2_w?: number;
  active_power_l2_w?: number;
  power_l3_w?: number;
  active_power_l3_w?: number;
  current_a?: number;
  active_current_a?: number;
  average_power_15m_w?: number;
  active_power_average_w?: number;
  monthly_power_peak_w?: number;
  montly_power_peak_w?: number;
  energy_import_kwh?: number;
  total_power_import_kwh?: number;
  energy_export_kwh?: number;
  total_power_export_kwh?: number;
  tariff?: number;
  active_tariff?: number;
  meter_model?: string;
  timestamp?: number | string;
  external?: P1External[];
}

const pick = (...vals: (number | undefined)[]): number | null => {
  for (const v of vals) {
    const n = num(v);
    if (n !== null) return n;
  }
  return null;
};

/** Read the P1 meter (v2 HTTPS API with bearer token). */
export async function readP1(device: DeviceConfig): Promise<ReadResult<P1Reading>> {
  const res = await getJson<P1Raw>(`https://${device.ip}/api/measurement`, {
    insecure: true,
    token: device.token,
  });

  if (!res.online || !res.data) {
    return { online: false, status: res.status, error: res.error };
  }

  const d = res.data;
  const gas = d.external?.find((x) => x.type === "gas_meter")?.value;
  const water = d.external?.find((x) => x.type === "water_meter")?.value;

  const reading: P1Reading = {
    powerW: pick(d.power_w, d.active_power_w),
    powerL1W: pick(d.power_l1_w, d.active_power_l1_w),
    powerL2W: pick(d.power_l2_w, d.active_power_l2_w),
    powerL3W: pick(d.power_l3_w, d.active_power_l3_w),
    currentA: pick(d.current_a, d.active_current_a),
    averagePower15mW: pick(d.average_power_15m_w, d.active_power_average_w),
    monthlyPeakW: pick(d.monthly_power_peak_w, d.montly_power_peak_w),
    importKwh: pick(d.energy_import_kwh, d.total_power_import_kwh),
    exportKwh: pick(d.energy_export_kwh, d.total_power_export_kwh),
    gasM3: num(gas),
    waterM3: num(water),
    tariff: pick(d.tariff, d.active_tariff),
    meterModel: typeof d.meter_model === "string" ? d.meter_model : null,
    timestamp: d.timestamp ?? null,
  };

  return { online: true, status: res.status, data: reading };
}
