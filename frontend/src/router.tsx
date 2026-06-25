import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { PlugsPage } from "./pages/PlugsPage";
import { PlugDetailPage } from "./pages/PlugDetailPage";
import { SchedulesPage } from "./pages/SchedulesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "plugs", element: <PlugsPage /> },
      { path: "plugs/:serial", element: <PlugDetailPage /> },
      { path: "schedules", element: <SchedulesPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
