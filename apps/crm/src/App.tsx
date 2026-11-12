import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ListSkeleton } from "@/components/States";
import { LoginPage } from "@/features/auth/LoginPage";
import { BrandDetailPage } from "@/features/brands/BrandDetailPage";
import { BrandsPage } from "@/features/brands/BrandsPage";
import { CalendarPage } from "@/features/calendar/CalendarPage";
import { ClientApp } from "@/features/calendar/ClientApp";
import { InboxPage } from "@/features/inbox/InboxPage";
import { VisualLibraryPage } from "@/features/library/VisualLibraryPage";
import { MediaLibraryPage } from "@/features/media/MediaLibraryPage";
import { MonitorPage } from "@/features/monitor/MonitorPage";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { ProjectDetailPage } from "@/features/projects/ProjectDetailPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { StudioPage } from "@/features/studio/StudioPage";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { useWorkspace, WorkspaceProvider } from "@/lib/workspace";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: true },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "inbox", element: <InboxPage /> },
      { path: "projects", element: <Navigate to="/inbox" replace /> },
      { path: "projects/:id", element: <ProjectDetailPage /> },
      { path: "brands", element: <BrandsPage /> },
      { path: "brands/:id", element: <BrandDetailPage /> },
      { path: "settings", element: <SettingsPage /> },
      {
        path: "creative",
        element: <StudioPage />,
      },
      { path: "visuals", element: <VisualLibraryPage /> },
      {
        path: "media",
        element: <MediaLibraryPage />,
      },
      { path: "calendar", element: <CalendarPage /> },
      {
        path: "monitor",
        element: <MonitorPage />,
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

/** Client accounts (P5-T26) get their own app with only the calendar; everyone else the full CRM. */
function RoleRouter() {
  const { role, loading } = useWorkspace();
  if (loading) {
    return (
      <div className="mx-auto max-w-md p-10">
        <ListSkeleton rows={3} />
      </div>
    );
  }
  return role === "client" ? <ClientApp /> : <RouterProvider router={router} />;
}

function Gate() {
  const { session, loading } = useAuth();
  const { dir } = useI18n();
  if (loading) {
    return (
      <div className="mx-auto max-w-md p-10">
        <ListSkeleton rows={3} />
      </div>
    );
  }
  return (
    <>
      {session ? (
        <WorkspaceProvider>
          <RoleRouter />
        </WorkspaceProvider>
      ) : (
        <LoginPage />
      )}
      <Toaster
        position={dir === "rtl" ? "bottom-left" : "bottom-right"}
        dir={dir}
        richColors
        closeButton
      />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
