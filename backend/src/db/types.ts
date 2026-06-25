/** Row shapes as stored in SQLite (snake_case columns). */

export interface SampleRow {
  id: number;
  ts: number;
  grid_power_w: number | null;
  pv_power_w: number | null;
  battery_power_w: number | null;
  battery_soc: number | null;
  price_eur_kwh: number | null;
  import_kwh: number | null;
  export_kwh: number | null;
  gas_m3: number | null;
  water_m3: number | null;
}

export interface PlugSampleRow {
  id: number;
  ts: number;
  ip: string;
  name: string;
  room: string | null;
  icon: string | null;
  power_w: number | null;
  import_kwh: number | null;
  wifi_strength: number | null;
}

export interface SettingRow {
  key: string;
  value: string;
}

export interface DeviceNameRow {
  serial: string;
  name: string;
}

export interface DailyRollupRow {
  day: string; // YYYY-MM-DD (local)
  import_kwh: number;
  export_kwh: number;
  solar_kwh: number;
  self_kwh: number;
  battery_charge_kwh: number;
  battery_discharge_kwh: number;
  gross_cost_eur: number;
  net_cost_eur: number;
  export_revenue_eur: number;
  gas_m3: number;
  water_m3: number;
  min_soc: number | null;
  max_soc: number | null;
}

/** Named-parameter insert shapes (camelCase to match @param bindings). */
export interface SampleInsert {
  ts: number;
  gridPowerW: number | null;
  pvPowerW: number | null;
  batteryPowerW: number | null;
  batterySoc: number | null;
  priceEurKwh: number | null;
  importKwh: number | null;
  exportKwh: number | null;
  gasM3: number | null;
  waterM3: number | null;
}

export interface PlugSampleInsert {
  ts: number;
  ip: string;
  name: string;
  room: string | null;
  icon: string | null;
  powerW: number | null;
  importKwh: number | null;
  wifiStrength: number | null;
}
