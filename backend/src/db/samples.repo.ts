import type { DB } from "./index.js";
import type { PlugSampleInsert, PlugSampleRow, SampleInsert, SampleRow } from "./types.js";

export class SamplesRepo {
  constructor(private db: DB) {}

  insertSample(sample: SampleInsert): void {
    this.db
      .prepare(
        `INSERT INTO samples (
          ts, grid_power_w, pv_power_w, battery_power_w, battery_soc,
          price_eur_kwh, import_kwh, export_kwh, gas_m3, water_m3
        ) VALUES (
          @ts, @gridPowerW, @pvPowerW, @batteryPowerW, @batterySoc,
          @priceEurKwh, @importKwh, @exportKwh, @gasM3, @waterM3
        )`
      )
      .run(sample);
  }

  insertPlugSample(sample: PlugSampleInsert): void {
    this.db
      .prepare(
        `INSERT INTO plug_samples (
          ts, ip, name, room, icon, power_w, import_kwh, wifi_strength
        ) VALUES (
          @ts, @ip, @name, @room, @icon, @powerW, @importKwh, @wifiStrength
        )`
      )
      .run(sample);
  }

  /** Insert many plug samples atomically. */
  insertPlugSamples(samples: PlugSampleInsert[]): void {
    const insert = this.db.prepare(
      `INSERT INTO plug_samples (
        ts, ip, name, room, icon, power_w, import_kwh, wifi_strength
      ) VALUES (
        @ts, @ip, @name, @room, @icon, @powerW, @importKwh, @wifiStrength
      )`
    );
    this.db.transaction((rows: PlugSampleInsert[]) => {
      for (const r of rows) insert.run(r);
    })(samples);
  }

  getSamplesSince(startTs: number): SampleRow[] {
    return this.db
      .prepare("SELECT * FROM samples WHERE ts >= ? ORDER BY ts ASC")
      .all(startTs) as SampleRow[];
  }

  getSamplesBetween(startTs: number, endTs: number): SampleRow[] {
    return this.db
      .prepare("SELECT * FROM samples WHERE ts >= ? AND ts < ? ORDER BY ts ASC")
      .all(startTs, endTs) as SampleRow[];
  }

  getPlugSamplesSince(startTs: number): PlugSampleRow[] {
    return this.db
      .prepare("SELECT * FROM plug_samples WHERE ts >= ? ORDER BY ip, ts ASC")
      .all(startTs) as PlugSampleRow[];
  }

  getPlugSamplesByIpSince(ip: string, startTs: number): PlugSampleRow[] {
    return this.db
      .prepare("SELECT * FROM plug_samples WHERE ip = ? AND ts >= ? ORDER BY ts ASC")
      .all(ip, startTs) as PlugSampleRow[];
  }

  getFirstSampleTs(): number | null {
    const row = this.db.prepare("SELECT MIN(ts) AS ts FROM samples").get() as { ts: number | null };
    return row?.ts ?? null;
  }

  getLastSampleTs(): number | null {
    const row = this.db.prepare("SELECT MAX(ts) AS ts FROM samples").get() as { ts: number | null };
    return row?.ts ?? null;
  }

  countSamples(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS c FROM samples").get() as { c: number };
    return row.c;
  }
}
