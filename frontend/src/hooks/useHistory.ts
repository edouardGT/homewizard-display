import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import { endpoints } from "../lib/api/endpoints";
import { keys } from "../lib/api/queryKeys";
import type { HistoryResponse, Range } from "../types/api";

export function useHistory(range: Range) {
  return useQuery({
    queryKey: keys.history(range),
    queryFn: () => apiFetch<HistoryResponse>(endpoints.history(range)),
    staleTime: 60_000,
  });
}
