import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import type { PlugHistory, Range } from "../types/api";

export function usePlugHistory(serial: string, range: Range) {
  return useQuery({
    queryKey: ["plugHistory", serial, range],
    queryFn: () => apiFetch<PlugHistory>(`/api/plugs/${serial}/history?range=${range}`),
    enabled: !!serial,
    staleTime: 30_000,
  });
}
