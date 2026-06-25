/** API contract types — must match the backend routes. */

export type Range = "day" | "week" | "month" | "year";

export interface Summary {
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
  plugTotalW: number;
  tariff: number | null;
  meterModel: string | null;
  timestamp: number | string | null;
  actualPriceEurKwh: number;
  pvPowerW: number | null;
  batteryPowerW: number | null;
  batterySoc: number | null;
  todayGrossCostEur: number;
  todaySolarBatterySavingEur: number;
  todayNetSpendEur: number;
  todayGridImportKwh: number;
  todaySelfKwh: number;
}

export interface DeviceData {
  powerW?: number | null;
  powerOn?: boolean | null;
  switchLock?: boolean | null;
  [k: string]: unknown;
}

export interface Device {
  name: string;
  type: "p1" | "plug";
  ip: string;
  api: "v1" | "v2";
  icon: string;
  serial: string | null;
  room: string | null;
  online: boolean;
  status?: number;
  lastSeenTs: number | null;
  error?: string;
  data: DeviceData;
}

export interface DashboardResponse {
  updatedAt: string;
  devices: Device[];
  summary: Summary;
}

export interface HistoryPoint {
  ts: number;
  time: string;
  gridPowerW: number | null;
  pvPowerW: number | null;
  batteryPowerW: number | null;
  batterySoc: number | null;
  gasM3: number | null;
  waterM3: number | null;
  priceEurKwh: number | null;
}

export interface HistoryResponse {
  range: Range;
  points: HistoryPoint[];
  electricity: { gridImportKwh: number; gridExportKwh: number };
  solar: { productionKwh: number; selfConsumedKwh: number; selfConsumptionPct: number };
  battery: { minSoc: number | null; maxSoc: number | null; chargedKwh: number; dischargedKwh: number };
  gas: { usedM3: number; estimatedCostEur: number };
  water: { usedM3: number; estimatedCostEur: number };
  finance: {
    grossElectricityCostEur: number;
    solarSavingEur: number;
    exportRevenueEur: number;
    netElectricityCostEur: number;
    totalUtilityCostEur: number;
  };
}

export interface PlugStat {
  ip: string;
  serial: string | null;
  name: string;
  room: string | null;
  icon: string | null;
  currentPowerW: number | null;
  energyKwh: number;
  estimatedCostEur: number;
  wifiStrength: number | null;
  online?: boolean;
  powerOn?: boolean | null;
  switchLock?: boolean | null;
}

export interface PlugsResponse {
  range: Range;
  plugs: PlugStat[];
}

export interface Settings {
  electricityPriceEurKwh: number;
  gasPriceEurM3: number;
  waterPriceEurM3: number;
  exportFactor: number;
  plugPriceEurKwh: number;
  alertHighPowerW: number;
  alertBatteryLowSoc: number;
}

export interface SettingsResponse {
  settings: Settings;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  since: number;
}

export interface AlertsResponse {
  alerts: Alert[];
}

export type ScheduleKind = "time" | "price" | "standby";
export type ScheduleAction = "on" | "off";

export interface Schedule {
  id: number;
  serial: string;
  label: string | null;
  enabled: number;
  kind: ScheduleKind;
  action: ScheduleAction;
  time_hhmm: string | null;
  days: string | null;
  price_threshold: number | null;
  price_dir: "above" | "below" | null;
  standby_w: number | null;
  standby_min: number | null;
}

export interface ScheduleInput {
  serial: string;
  label?: string | null;
  enabled?: boolean;
  kind: ScheduleKind;
  action?: ScheduleAction;
  timeHhmm?: string | null;
  days?: number[] | null;
  priceThreshold?: number | null;
  priceDir?: "above" | "below" | null;
  standbyW?: number | null;
  standbyMin?: number | null;
}

export interface HealthResponse {
  status: string;
  uptimeS: number;
  lastSampleTs: number | null;
  sampleAgeS: number | null;
  sampleCount: number;
  dbOk: boolean;
  devices: { online: number; total: number };
  version: string;
}
