import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Alert } from "../types/api";

/**
 * Fire a local notification for a server-evaluated alert when running inside the
 * Capacitor native app. On web this is a no-op (alerts show in the banner).
 */
const isNative = Capacitor.isNativePlatform();
let permissionGranted = false;

export async function ensureNotificationPermission(): Promise<void> {
  if (!isNative) return;
  const status = await LocalNotifications.requestPermissions();
  permissionGranted = status.display === "granted";
}

/** Stable numeric id from an alert id string. */
function notifId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % 2147483647;
}

export async function notifyAlerts(alerts: Alert[]): Promise<void> {
  if (!isNative || !permissionGranted || alerts.length === 0) return;
  await LocalNotifications.schedule({
    notifications: alerts.map((a) => ({
      id: notifId(a.id),
      title: a.title,
      body: a.message,
    })),
  });
}
