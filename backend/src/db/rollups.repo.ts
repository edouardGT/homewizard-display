import type { DB } from "./index.js";
import type { DailyRollupRow } from "./types.js";

export class RollupsRepo {
  constructor(private db: DB) {}

  upsert(row: DailyRollupRow): void {
    this.db
      .prepare(
        `INSERT INTO daily_rollups (
          day, import_kwh, export_kwh, solar_kwh, self_kwh,
          battery_charge_kwh, battery_discharge_kwh, gross_cost_eur,
          net_cost_eur, export_revenue_eur, gas_m3, water_m3, min_soc, max_soc
        ) VALUES (
          @day, @import_kwh, @export_kwh, @solar_kwh, @self_kwh,
          @battery_charge_kwh, @battery_discharge_kwh, @gross_cost_eur,
          @net_cost_eur, @export_revenue_eur, @gas_m3, @water_m3, @min_soc, @max_soc
        )
        ON CONFLICT(day) DO UPDATE SET
          import_kwh = excluded.import_kwh,
          export_kwh = excluded.export_kwh,
          solar_kwh = excluded.solar_kwh,
          self_kwh = excluded.self_kwh,
          battery_charge_kwh = excluded.battery_charge_kwh,
          battery_discharge_kwh = excluded.battery_discharge_kwh,
          gross_cost_eur = excluded.gross_cost_eur,
          net_cost_eur = excluded.net_cost_eur,
          export_revenue_eur = excluded.export_revenue_eur,
          gas_m3 = excluded.gas_m3,
          water_m3 = excluded.water_m3,
          min_soc = excluded.min_soc,
          max_soc = excluded.max_soc`
      )
      .run(row);
  }

  getBetween(fromDay: string, toDay: string): DailyRollupRow[] {
    return this.db
      .prepare("SELECT * FROM daily_rollups WHERE day >= ? AND day <= ? ORDER BY day ASC")
      .all(fromDay, toDay) as DailyRollupRow[];
  }

  getExistingDays(): Set<string> {
    const rows = this.db.prepare("SELECT day FROM daily_rollups").all() as { day: string }[];
    return new Set(rows.map((r) => r.day));
  }
}
