import { getJson } from "./httpClient.js";

interface DeviceInfoRaw {
  serial?: string;
  product_name?: string;
  product_type?: string;
}

export interface DeviceInfo {
  serial: string | null;
  productName: string | null;
}

/**
 * Read a device's basic info (v1 `/api`). This is the only place the serial is
 * exposed locally — the user-assigned (app) name is NOT available on the LAN.
 */
export async function readDeviceInfo(ip: string): Promise<DeviceInfo> {
  const res = await getJson<DeviceInfoRaw>(`http://${ip}/api`, { timeoutMs: 2000 });
  return {
    serial: res.data?.serial ?? null,
    productName: res.data?.product_name ?? null,
  };
}
