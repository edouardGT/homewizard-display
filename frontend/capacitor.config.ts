import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Mode B (default): bundle the built frontend (webDir) and point API calls at
 * the LAN backend via VITE_API_BASE_URL at build time. The app opens offline
 * using the PWA/service-worker caches.
 *
 * Mode A (alternative): comment out `webDir` and set `server.url` to the Pi/LAN
 * backend (which serves the built frontend) for an always-fresh thin shell:
 *   server: { url: "http://homewizard.local", cleartext: true }
 */
const config: CapacitorConfig = {
  appId: "com.homewizard.energydashboard",
  appName: "Energy Dashboard",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
