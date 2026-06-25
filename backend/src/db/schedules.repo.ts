import type { DB } from "./index.js";
import type { ScheduleRow } from "./types.js";

export type ScheduleInput = Omit<ScheduleRow, "id">;

export class SchedulesRepo {
  constructor(private db: DB) {}

  list(): ScheduleRow[] {
    return this.db.prepare("SELECT * FROM schedules ORDER BY id ASC").all() as ScheduleRow[];
  }

  listEnabled(): ScheduleRow[] {
    return this.db
      .prepare("SELECT * FROM schedules WHERE enabled = 1 ORDER BY id ASC")
      .all() as ScheduleRow[];
  }

  get(id: number): ScheduleRow | undefined {
    return this.db.prepare("SELECT * FROM schedules WHERE id = ?").get(id) as ScheduleRow | undefined;
  }

  create(s: ScheduleInput): ScheduleRow {
    const info = this.db
      .prepare(
        `INSERT INTO schedules
          (serial, label, enabled, kind, action, time_hhmm, days, price_threshold, price_dir, standby_w, standby_min)
         VALUES
          (@serial, @label, @enabled, @kind, @action, @time_hhmm, @days, @price_threshold, @price_dir, @standby_w, @standby_min)`
      )
      .run(s);
    return this.get(Number(info.lastInsertRowid))!;
  }

  update(id: number, s: ScheduleInput): ScheduleRow | undefined {
    this.db
      .prepare(
        `UPDATE schedules SET
          serial=@serial, label=@label, enabled=@enabled, kind=@kind, action=@action,
          time_hhmm=@time_hhmm, days=@days, price_threshold=@price_threshold,
          price_dir=@price_dir, standby_w=@standby_w, standby_min=@standby_min
         WHERE id=@id`
      )
      .run({ ...s, id });
    return this.get(id);
  }

  delete(id: number): void {
    this.db.prepare("DELETE FROM schedules WHERE id = ?").run(id);
  }
}
