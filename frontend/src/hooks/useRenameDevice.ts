import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";

/** Rename a device by serial; refreshes dashboard + plug views on success. */
export function useRenameDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serial, name }: { serial: string; name: string }) =>
      apiFetch<{ serial: string; name: string }>(`/api/devices/${serial}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["plugs"] });
    },
  });
}
