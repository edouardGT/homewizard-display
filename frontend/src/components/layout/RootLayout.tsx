import { Outlet } from "react-router";
import { NavBar } from "./NavBar";
import { ErrorBanner } from "./ErrorBanner";
import { useAlerts } from "../../hooks/useAlerts";
import { useOnline } from "../../hooks/useOnline";
import { useNativeNotifications } from "../../hooks/useNativeNotifications";

export function RootLayout() {
  const { data } = useAlerts();
  const alerts = data?.alerts ?? [];
  const online = useOnline();
  useNativeNotifications();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-lg font-bold">Energy Dashboard</span>
          </div>
          <NavBar />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!online && (
          <div className="mb-4">
            <ErrorBanner message="Offline — showing the last known data." variant="stale" />
          </div>
        )}
        {alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {alerts.map((a) => (
              <ErrorBanner
                key={a.id}
                message={`${a.title}: ${a.message}`}
                variant={a.severity === "critical" ? "error" : "warning"}
              />
            ))}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
