import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ListSkeleton } from "@/components/States";
import { LoginPage } from "@/features/auth/LoginPage";
import { BrandDetailPage } from "@/features/brands/BrandDetailPage";
import { BrandsPage } from "@/features/brands/BrandsPage";
import { InboxPage } from "@/features/inbox/InboxPage";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { PlaceholderPage } from "@/features/placeholders/PlaceholderPage";
import { ProjectDetailPage } from "@/features/projects/ProjectDetailPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { StudioPage } from "@/features/studio/StudioPage";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { WorkspaceProvider } from "@/lib/workspace";

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
      {
        path: "media",
        element: (
          <PlaceholderPage title="nav.media" description="placeholder.media" phase="Phase 4" />
        ),
      },
      {
        path: "calendar",
        element: (
          <PlaceholderPage
            title="nav.calendar"
            description="placeholder.calendar"
            phase="Phase 6"
          />
        ),
      },
      {
        path: "monitor",
        element: (
          <PlaceholderPage title="nav.monitor" description="placeholder.monitor" phase="Phase 4" />
        ),
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

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
          <RouterProvider router={router} />
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
