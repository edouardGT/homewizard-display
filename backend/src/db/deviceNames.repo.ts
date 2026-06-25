import type { DB } from "./index.js";
import type { DeviceNameRow } from "./types.js";

/** Customer-assigned device names, keyed by serial (stable across IP changes). */
export class DeviceNamesRepo {
  constructor(private db: DB) {}

  getAll(): Map<string, string> {
    const rows = this.db.prepare("SELECT serial, name FROM device_names").all() as DeviceNameRow[];
    return new Map(rows.map((r) => [r.serial, r.name]));
  }

  set(serial: string, name: string): void {
    this.db
      .prepare(
        "INSERT INTO device_names (serial, name) VALUES (?, ?) ON CONFLICT(serial) DO UPDATE SET name = excluded.name"
      )
      .run(serial, name);
  }

  delete(serial: string): void {
    this.db.prepare("DELETE FROM device_names WHERE serial = ?").run(serial);
  }
}
