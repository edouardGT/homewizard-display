import "dotenv/config";
import { loadConfig, defaultSettings } from "./config/env.js";
import { buildDevices, enrichPlugNames } from "./config/devices.js";
import { openDb, closeDb } from "./db/index.js";
import { SamplesRepo } from "./db/samples.repo.js";
import { SettingsRepo } from "./db/settings.repo.js";
import { RollupsRepo } from "./db/rollups.repo.js";
import { DeviceNamesRepo } from "./db/deviceNames.repo.js";
import { startSampler } from "./services/sampler.js";
import { Analytics } from "./services/analytics.js";
import { RollupService } from "./services/rollups.js";
import { createApp } from "./app.js";

const VERSION = "1.0.0";

async function main(): Promise<void> {
  const config = loadConfig();
  const devices = buildDevices(config);
  // Resolve plug serials → stable names + icons before sampling begins.
  await enrichPlugNames(devices, config).catch((err) =>
    console.error("[startup] plug name enrichment failed", err)
  );

  const db = openDb(config.DB_PATH);
  const samplesRepo = new SamplesRepo(db);
  const settingsRepo = new SettingsRepo(db);
  const rollupsRepo = new RollupsRepo(db);
  const deviceNamesRepo = new DeviceNamesRepo(db);

  // Seed editable settings from env defaults on first boot.
  settingsRepo.seedDefaults(defaultSettings(config));

  // Energy integration clamp tracks the sample rate (~2.5× interval).
  const clampHours = (config.SAMPLE_INTERVAL_MS / 3_600_000) * 2.5;

  const analytics = new Analytics(samplesRepo, clampHours);
  const rollupService = new RollupService(samplesRepo, rollupsRepo, settingsRepo, clampHours);
  rollupService.backfill();
  rollupService.start();

  const sampler = startSampler({ config, devices, samplesRepo, settingsRepo, deviceNamesRepo });

  const { app } = createApp({
    sampler,
    analytics,
    samplesRepo,
    settingsRepo,
    rollupsRepo,
    deviceNamesRepo,
    version: VERSION,
  });

  const server = app.listen(config.PORT, () => {
    console.log(`HomeWizard backend v${VERSION} on http://localhost:${config.PORT}`);
    console.log(`Polling ${devices.length} device(s) every ${config.SAMPLE_INTERVAL_MS}ms`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n[${signal}] shutting down...`);
    sampler.stop();
    rollupService.stop();
    server.close(() => {
      closeDb(db);
      process.exit(0);
    });
    // Hard exit if close hangs.
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[startup] fatal", err);
  process.exit(1);
});
