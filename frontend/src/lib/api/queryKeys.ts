import type { Range } from "../../types/api";

export const keys = {
  dashboard: ["dashboard"] as const,
  history: (range: Range) => ["history", range] as const,
  plugs: (range: Range) => ["plugs", range] as const,
  settings: ["settings"] as const,
  alerts: ["alerts"] as const,
};
