import { useEffect, useRef } from "react";
import { useAlerts } from "./useAlerts";
import { ensureNotificationPermission, notifyAlerts } from "../lib/notifications";

/**
 * Bridge server alerts to native local notifications. Only fires for alert ids
 * not seen before this session, so re-polling the same active alert is silent.
 */
export function useNativeNotifications() {
  const { data } = useAlerts();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    void ensureNotificationPermission();
  }, []);

  useEffect(() => {
    const alerts = data?.alerts ?? [];
    const fresh = alerts.filter((a) => !seen.current.has(a.id));
    if (fresh.length) {
      fresh.forEach((a) => seen.current.add(a.id));
      void notifyAlerts(fresh);
    }
    // Drop cleared alerts so they can notify again if they recur.
    const active = new Set(alerts.map((a) => a.id));
    for (const id of seen.current) if (!active.has(id)) seen.current.delete(id);
  }, [data]);
}
