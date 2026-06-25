import type { Range } from "../../types/api";

export const endpoints = {
  dashboard: () => "/api/dashboard",
  history: (range: Range) => `/api/history?range=${range}`,
  analytics: (range: Range, granularity: string) =>
    `/api/analytics?range=${range}&granularity=${granularity}`,
  plugs: (range: Range) => `/api/plugs?range=${range}`,
  settings: () => "/api/settings",
  alerts: () => "/api/alerts",
  health: () => "/api/health",
};
