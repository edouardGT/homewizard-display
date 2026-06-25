import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import { endpoints } from "../lib/api/endpoints";
import { keys } from "../lib/api/queryKeys";
import type { DashboardResponse } from "../types/api";

export function useDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => apiFetch<DashboardResponse>(endpoints.dashboard()),
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
  });
}
