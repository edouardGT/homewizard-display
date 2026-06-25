import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import type { Forecast } from "../types/api";

export function useForecast() {
  return useQuery({
    queryKey: ["forecast"],
    queryFn: () => apiFetch<Forecast>("/api/forecast"),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
