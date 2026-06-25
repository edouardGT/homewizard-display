import type { DB } from "./index.js";
import type { SettingRow } from "./types.js";

export type SettingsMap = Record<string, number | string | boolean>;

export class SettingsRepo {
  constructor(private db: DB) {}

  getAll(): SettingsMap {
    const rows = this.db.prepare("SELECT key, value FROM settings").all() as SettingRow[];
    const out: SettingsMap = {};
    for (const { key, value } of rows) out[key] = parseValue(value);
    return out;
  }

  get(key: string): number | string | boolean | undefined {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
      | { value: string }
      | undefined;
    return row ? parseValue(row.value) : undefined;
  }

  set(key: string, value: number | string | boolean): void {
    this.db
      .prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      )
      .run(key, String(value));
  }

  setMany(values: SettingsMap): void {
    const tx = this.db.transaction((entries: [string, number | string | boolean][]) => {
      for (const [k, v] of entries) this.set(k, v);
    });
    tx(Object.entries(values));
  }

  /** Seed defaults only for keys not already present (first boot). */
  seedDefaults(defaults: SettingsMap): void {
    const existing = this.getAll();
    const missing: SettingsMap = {};
    for (const [k, v] of Object.entries(defaults)) {
      if (!(k in existing)) missing[k] = v;
    }
    if (Object.keys(missing).length) this.setMany(missing);
  }
}

function parseValue(raw: string): number | string | boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  const n = Number(raw);
  if (raw.trim() !== "" && Number.isFinite(n)) return n;
  return raw;
}
