import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import { endpoints } from "../lib/api/endpoints";
import { keys } from "../lib/api/queryKeys";
import type { AlertsResponse } from "../types/api";

export function useAlerts() {
  return useQuery({
    queryKey: keys.alerts,
    queryFn: () => apiFetch<AlertsResponse>(endpoints.alerts()),
    refetchInterval: 10_000,
  });
}
