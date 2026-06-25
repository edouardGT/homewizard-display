/** Null-safe formatters. All render "—" for null/undefined/NaN. */

const LOCALE = "nl-BE";
const DASH = "—";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function watts(v: number | null | undefined): string {
  if (!isNum(v)) return DASH;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString(LOCALE, { maximumFractionDigits: 2 })} kW`;
  return `${Math.round(v).toLocaleString(LOCALE)} W`;
}

export function wattsRaw(v: number | null | undefined): string {
  if (!isNum(v)) return DASH;
  return `${Math.round(v).toLocaleString(LOCALE)} W`;
}

export function kwh(v: number | null | undefined, digits = 2): string {
  if (!isNum(v)) return DASH;
  return `${v.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits })} kWh`;
}

export function euro(v: number | null | undefined, digits = 2): string {
  if (!isNum(v)) return DASH;
  return v.toLocaleString(LOCALE, { style: "currency", currency: "EUR", minimumFractionDigits: digits });
}

export function eurPerKwh(v: number | null | undefined): string {
  if (!isNum(v)) return DASH;
  return `${euro(v, 3)}/kWh`;
}

export function cubicMeters(v: number | null | undefined, digits = 3): string {
  if (!isNum(v)) return DASH;
  return `${v.toLocaleString(LOCALE, { maximumFractionDigits: digits })} m³`;
}

export function percent(v: number | null | undefined, digits = 0): string {
  if (!isNum(v)) return DASH;
  return `${v.toLocaleString(LOCALE, { maximumFractionDigits: digits })}%`;
}

export function amps(v: number | null | undefined): string {
  if (!isNum(v)) return DASH;
  return `${v.toLocaleString(LOCALE, { maximumFractionDigits: 1 })} A`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return DASH;
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  return `${Math.round(secs / 3600)}h ago`;
}
