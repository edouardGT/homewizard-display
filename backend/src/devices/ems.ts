import { getJson, num } from "./httpClient.js";
import type { EmsReading, ReadResult } from "./types.js";

interface EmsRaw {
  consumptionElectricityPrice?: number;
  totalPVPowerFiltered?: number;
  TotalInvPowerFiltered?: number;
  stateOfChargeFiltered?: number;
}

/** Read the MyEmitter EMS (solar / battery / dynamic price). */
export async function readEms(url: string | undefined): Promise<ReadResult<EmsReading>> {
  if (!url) return { online: false, error: "EMS_URL not configured" };

  const res = await getJson<EmsRaw>(url, { timeoutMs: 2000 });
  if (!res.online || !res.data) {
    return { online: false, status: res.status, error: res.error };
  }

  const d = res.data;
  const reading: EmsReading = {
    priceEurKwh: num(d.consumptionElectricityPrice),
    pvPowerW: num(d.totalPVPowerFiltered),
    batteryPowerW: num(d.TotalInvPowerFiltered),
    batterySoc: num(d.stateOfChargeFiltered),
  };

  return { online: true, status: res.status, data: reading };
}
