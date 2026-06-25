import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import { endpoints } from "../lib/api/endpoints";
import { keys } from "../lib/api/queryKeys";
import type { Settings, SettingsResponse } from "../types/api";

export function useSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: () => apiFetch<SettingsResponse>(endpoints.settings()),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Settings>) =>
      apiFetch<SettingsResponse>(endpoints.settings(), {
        method: "PUT",
        body: JSON.stringify(patch),
      }),
    onSuccess: (data) => {
      qc.setQueryData(keys.settings, data);
      qc.invalidateQueries({ queryKey: keys.history("day") });
      qc.invalidateQueries({ queryKey: keys.plugs("day") });
    },
  });
}
