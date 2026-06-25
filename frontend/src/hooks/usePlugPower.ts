import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import type { DeviceData } from "../types/api";

/** Toggle a socket on/off by serial. */
export function usePlugPower() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serial, on }: { serial: string; on: boolean }) =>
      apiFetch<{ serial: string; state: DeviceData }>(`/api/devices/${serial}/power`, {
        method: "PUT",
        body: JSON.stringify({ on }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
