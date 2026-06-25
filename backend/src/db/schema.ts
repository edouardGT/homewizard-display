/** Additive DDL — safe to run on every boot (CREATE ... IF NOT EXISTS). */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  grid_power_w REAL,
  pv_power_w REAL,
  battery_power_w REAL,
  battery_soc REAL,
  price_eur_kwh REAL,
  import_kwh REAL,
  export_kwh REAL,
  gas_m3 REAL,
  water_m3 REAL
);

CREATE TABLE IF NOT EXISTS plug_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  ip TEXT NOT NULL,
  name TEXT NOT NULL,
  room TEXT,
  icon TEXT,
  power_w REAL,
  import_kwh REAL,
  wifi_strength REAL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS device_names (
  serial TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial TEXT NOT NULL,
  label TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  kind TEXT NOT NULL,                  -- 'time' | 'price' | 'standby'
  action TEXT NOT NULL DEFAULT 'off',  -- 'on' | 'off'
  time_hhmm TEXT,                      -- 'HH:MM' (time rules)
  days TEXT,                           -- csv of 0-6 (0=Sun), empty = every day
  price_threshold REAL,               -- €/kWh (price rules)
  price_dir TEXT,                      -- 'above' | 'below'
  standby_w REAL,                     -- watts (standby rules)
  standby_min INTEGER                 -- sustained minutes (standby rules)
);

CREATE INDEX IF NOT EXISTS idx_schedules_serial ON schedules(serial);

CREATE TABLE IF NOT EXISTS daily_rollups (
  day TEXT PRIMARY KEY,
  import_kwh REAL NOT NULL DEFAULT 0,
  export_kwh REAL NOT NULL DEFAULT 0,
  solar_kwh REAL NOT NULL DEFAULT 0,
  self_kwh REAL NOT NULL DEFAULT 0,
  battery_charge_kwh REAL NOT NULL DEFAULT 0,
  battery_discharge_kwh REAL NOT NULL DEFAULT 0,
  gross_cost_eur REAL NOT NULL DEFAULT 0,
  net_cost_eur REAL NOT NULL DEFAULT 0,
  export_revenue_eur REAL NOT NULL DEFAULT 0,
  gas_m3 REAL NOT NULL DEFAULT 0,
  water_m3 REAL NOT NULL DEFAULT 0,
  min_soc REAL,
  max_soc REAL
);

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);

CREATE INDEX IF NOT EXISTS idx_samples_ts ON samples(ts);
CREATE INDEX IF NOT EXISTS idx_plug_samples_ts ON plug_samples(ts);
CREATE INDEX IF NOT EXISTS idx_plug_samples_ip_ts ON plug_samples(ip, ts);
`;

export const SCHEMA_VERSION = 1;
