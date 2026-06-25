/** Shared device-layer types. */

export type DeviceType = "p1" | "plug" | "ems";
export type ApiVersion = "v1" | "v2";

export interface DeviceConfig {
  name: string;
  type: DeviceType;
  ip: string;
  api: ApiVersion;
  token?: string;
  room?: string | null;
  icon: string;
  serial?: string;
}

/** Result of reading any device — never throws past its own boundary. */
export interface ReadResult<T> {
  online: boolean;
  status?: number;
  data?: T;
  error?: string;
}

/** Normalized P1 meter reading (field names map to the dashboard summary). */
export interface P1Reading {
  powerW: number | null;
  powerL1W: number | null;
  powerL2W: number | null;
  powerL3W: number | null;
  currentA: number | null;
  averagePower15mW: number | null;
  monthlyPeakW: number | null;
  importKwh: number | null;
  exportKwh: number | null;
  gasM3: number | null;
  waterM3: number | null;
  tariff: number | null;
  meterModel: string | null;
  timestamp: number | string | null;
}

/** Normalized smart-plug reading. */
export interface PlugReading {
  powerW: number | null;
  importKwh: number | null;
  wifiStrength: number | null;
}

/** Normalized MyEmitter EMS reading. */
export interface EmsReading {
  priceEurKwh: number | null;
  pvPowerW: number | null;
  batteryPowerW: number | null;
  batterySoc: number | null;
}
