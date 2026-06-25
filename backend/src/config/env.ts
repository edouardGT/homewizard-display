import { z } from "zod";

/**
 * Parse and validate process.env into a typed, immutable Config object.
 * These values define the *infrastructure* (what hardware exists, where the DB
 * lives). Mutable, user-editable values (prices, thresholds) live in the
 * settings table and are seeded from the PRICE_* / ALERT_* defaults here.
 */

const csv = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const DeviceMeta = z.record(
  z.string(),
  z.object({ name: z.string().optional(), room: z.string().optional() })
);

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5050),
  DB_PATH: z.string().default("./data/energy.db"),
  SAMPLE_INTERVAL_MS: z.coerce.number().int().positive().default(10_000),

  P1_IP: z.string().min(1, "P1_IP is required"),
  P1_TOKEN: z.string().min(1, "P1_TOKEN is required"),

  EMS_URL: z.string().url().optional(),

  PLUG_IPS: z.string().default("").transform(csv),

  DEVICE_META_JSON: z
    .string()
    .default("{}")
    .transform((raw, ctx) => {
      try {
        return DeviceMeta.parse(JSON.parse(raw));
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DEVICE_META_JSON is not valid JSON" });
        return {};
      }
    }),

  PRICE_ELECTRICITY_EUR_KWH: z.coerce.number().default(0.3),
  PRICE_GAS_EUR_M3: z.coerce.number().default(1.15),
  PRICE_WATER_EUR_M3: z.coerce.number().default(5.2),
  EXPORT_PRICE_FACTOR: z.coerce.number().default(0.65),
  PRICE_PLUG_EUR_KWH: z.coerce.number().default(0.3),

  ALERT_HIGH_POWER_W: z.coerce.number().default(7000),
  ALERT_BATTERY_LOW_SOC: z.coerce.number().default(15),
});

export type Config = z.infer<typeof EnvSchema>;

let cached: Config | null = null;

export function loadConfig(): Config {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Default seed values for the settings table (first boot only). */
export function defaultSettings(config: Config) {
  return {
    electricityPriceEurKwh: config.PRICE_ELECTRICITY_EUR_KWH,
    gasPriceEurM3: config.PRICE_GAS_EUR_M3,
    waterPriceEurM3: config.PRICE_WATER_EUR_M3,
    exportFactor: config.EXPORT_PRICE_FACTOR,
    plugPriceEurKwh: config.PRICE_PLUG_EUR_KWH,
    alertHighPowerW: config.ALERT_HIGH_POWER_W,
    alertBatteryLowSoc: config.ALERT_BATTERY_LOW_SOC,
  };
}
