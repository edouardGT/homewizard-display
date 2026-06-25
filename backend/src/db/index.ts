import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SCHEMA_SQL, SCHEMA_VERSION } from "./schema.js";

export type DB = Database.Database;

/** Open (or create) the SQLite database, enable WAL, and run the schema. */
export function openDb(dbPath: string): DB {
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);

  db.prepare("INSERT OR IGNORE INTO schema_version (version) VALUES (?)").run(SCHEMA_VERSION);

  return db;
}

/** Checkpoint the WAL and close cleanly — call on shutdown so no data is stranded. */
export function closeDb(db: DB): void {
  try {
    db.pragma("wal_checkpoint(TRUNCATE)");
  } catch {
    /* ignore */
  }
  db.close();
}
