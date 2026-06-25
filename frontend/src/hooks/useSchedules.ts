import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api/client";
import type { Schedule, ScheduleInput } from "../types/api";

const KEY = ["schedules"] as const;

export function useSchedules() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<{ schedules: Schedule[] }>("/api/schedules"),
    staleTime: 30_000,
  });
}

export function useScheduleMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: ScheduleInput) =>
      apiFetch<Schedule>("/api/schedules", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: ScheduleInput }) =>
      apiFetch<Schedule>(`/api/schedules/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiFetch<{ ok: boolean }>(`/api/schedules/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
