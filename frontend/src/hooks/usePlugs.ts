import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import { endpoints } from "../lib/api/endpoints";
import { keys } from "../lib/api/queryKeys";
import type { PlugsResponse, Range } from "../types/api";

export function usePlugs(range: Range) {
  return useQuery({
    queryKey: keys.plugs(range),
    queryFn: () => apiFetch<PlugsResponse>(endpoints.plugs(range)),
    staleTime: 30_000,
  });
}
