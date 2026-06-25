# HomeWizard Energy Dashboard

A self-hosted energy dashboard for HomeWizard devices (P1 meter, smart plugs) plus a
MyEmitter EMS (solar / battery / dynamic price). Live tiles, an animated energy-flow
diagram, history & analytics, per-plug cost breakdown, settings, alerts, PWA/offline
support, and a Capacitor mobile wrapper.

## Architecture

```
backend/    Node + Express + TypeScript, better-sqlite3, undici
            ├─ samples every device on an interval → SQLite
            ├─ analytics/cost engine (day/week/month/year) + daily rollups
            └─ REST API (dashboard, history, analytics, plugs, settings, health, alerts)

frontend/   React 19 + TypeScript + Vite + Tailwind v4 + React Query + react-router + Recharts
            ├─ Dashboard, History, Plugs, Settings pages
            ├─ PWA (offline mode via service worker)
            └─ Capacitor wrapper (Android/iOS) with local notifications
```

## Quick start (local dev)

```bash
# Backend
cd backend
cp .env.example .env          # set P1_IP, P1_TOKEN, EMS_URL, PLUG_IPS
npm install
npm run dev                   # http://localhost:5050

# Frontend (second terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

## Production (Docker)

```bash
./install.sh                  # prompts for P1 IP/token, builds & starts
# → Dashboard at http://localhost:8080
```

Or manually:

```bash
cp backend/.env.example backend/.env   # edit values
docker compose up -d --build
```

The SQLite database persists in `./data` (bind-mounted). nginx serves the frontend
and proxies `/api` to the backend, so the app is same-origin in production.

## API

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/dashboard` | Live snapshot + today's running totals |
| GET | `/api/history?range=day\|week\|month\|year` | Time-series + aggregates |
| GET | `/api/analytics?range=&granularity=day\|week\|month` | Rollup-backed series |
| GET | `/api/plugs?range=` | Per-plug energy + cost |
| GET / PUT | `/api/settings` | Editable prices & alert thresholds |
| GET | `/api/health` | Liveness, data freshness, device status |
| GET | `/api/alerts` | Active alerts |

## Configuration

Infrastructure (device IPs, P1 token, EMS URL, sample interval) lives in `backend/.env`.
Editable prices and alert thresholds are stored in the SQLite `settings` table and can
be changed at runtime from the **Settings** page (seeded from env defaults on first boot).

## Mobile app (Capacitor)

```bash
cd frontend
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Default config bundles the built frontend (`webDir: dist`) and talks to the LAN backend;
see `capacitor.config.ts` for the alternative thin-shell (`server.url`) mode.

## Notes

- The backend records history only while running — keep it up (Docker `restart: unless-stopped`)
  for continuous data. Month/year analytics fill one bucket per day via the nightly rollup job.
- The P1 v2 API uses a self-signed certificate; the backend trusts it for that host only.
