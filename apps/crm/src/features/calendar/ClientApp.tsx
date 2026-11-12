import { CalendarCheck2, Languages, LogOut, Moon, Sun } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useSearchParams,
} from "react-router";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { type ClientPost, useClientPosts } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { useWorkspace } from "@/lib/workspace";
import { clientState, type ClientState } from "./calendar";
import { CalendarMonth, LegendDot, shortTitle } from "./CalendarMonth";
import { ClientPostDialog, STATE_BADGE } from "./ClientPostDialog";

const DOT: Record<ClientState, string> = {
  waiting: "bg-warning",
  approved: "bg-success",
  changes: "bg-destructive",
  scheduled: "bg-primary",
  published: "bg-muted-foreground",
};

/** The whole CRM for a client account (P5-T26): one calendar page. Nothing else is routed. */
export function ClientApp() {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <ClientShell />,
          children: [
            { index: true, element: <ClientCalendarPage /> },
            { path: "*", element: <Navigate to="/" replace /> },
          ],
        },
      ]),
    [],
  );
  return <RouterProvider router={router} />;
}

function ClientShell() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, toggle } = useTheme();
  const { signOut, session } = useAuth();
  const { profile, workspaceName, userId } = useWorkspace();
  const qc = useQueryClient();

  async function toggleLanguage() {
    const next = locale === "ar" ? "en" : "ar";
    setLocale(next);
    const { error } = await supabase.from("profiles").update({ locale: next }).eq("id", userId);
    if (!error) void qc.invalidateQueries({ queryKey: ["profile", userId] });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/95 px-4 backdrop-blur sm:px-6">
        <img src="/favicon.svg" alt="" className="size-7 rounded-lg" />
        <div className="min-w-0 flex-1 truncate text-sm font-medium">{workspaceName}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void toggleLanguage()}
          aria-label={t("lang.switch")}
        >
          <Languages />
          <span className="hidden sm:inline">{t("lang.switch")}</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={t("theme.toggle")}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
        <DropdownMenu dir={dir}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={session?.user.email ?? "account"}
            >
              <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {(profile?.display_name ?? session?.user.email ?? "?").slice(0, 1).toUpperCase()}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="font-medium text-foreground">{profile?.display_name}</div>
              <div>{session?.user.email}</div>
              <div className="mt-1">{t("role.client")}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut()}>
              <LogOut />
              {t("auth.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function PostRow({ post, onOpen }: { post: ClientPost; onOpen: () => void }) {
  const { t, locale } = useI18n();
  const state = clientState(post);
  const date = post.publish_date?.slice(0, 10);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-start text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1 truncate" dir="auto">
          {shortTitle(post.title)}
        </span>
        {date && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            }).format(new Date(date))}
          </span>
        )}
        <Badge variant={STATE_BADGE[state]} className="shrink-0">
          {t(`client.state.${state}`)}
        </Badge>
      </button>
    </li>
  );
}

function ClientCalendarPage() {
  const { t } = useI18n();
  const { workspaceId } = useWorkspace();
  const posts = useClientPosts(workspaceId);
  const [params, setParams] = useSearchParams();
  const all = posts.data ?? [];
  const open = all.find((p) => p.id === params.get("post")) ?? null;
  const show = (p: ClientPost) => setParams({ post: p.id });
  const waiting = all.filter((p) => clientState(p) === "waiting");
  const undated = all.filter((p) => !p.publish_date);

  return (
    <>
      <PageHeader title={t("client.title")} subtitle={t("client.subtitle")} />
      {posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => void posts.refetch()} />
      ) : posts.isLoading ? (
        <ListSkeleton rows={6} />
      ) : all.length === 0 ? (
        <EmptyState message={t("client.empty")} icon={<CalendarCheck2 className="size-5" />} />
      ) : (
        <div className="flex flex-col gap-8">
          {waiting.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">
                {t("client.waitingTitle", { n: waiting.length })}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {waiting.map((p) => (
                  <PostRow key={p.id} post={p} onOpen={() => show(p)} />
                ))}
              </ul>
            </section>
          )}
          <CalendarMonth
            posts={all}
            dot={(p) => DOT[clientState(p)]}
            onOpen={show}
            legend={
              <>
                <LegendDot className={DOT.waiting} label={t("client.state.waiting")} />
                <LegendDot className={DOT.approved} label={t("client.state.approved")} />
                <LegendDot className={DOT.changes} label={t("client.state.changes")} />
                <LegendDot className={DOT.scheduled} label={t("client.state.scheduled")} />
                <LegendDot className={DOT.published} label={t("client.state.published")} />
              </>
            }
          />
          {undated.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">{t("client.undatedTitle")}</h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {undated.map((p) => (
                  <PostRow key={p.id} post={p} onOpen={() => show(p)} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
      <ClientPostDialog post={open} onClose={() => setParams({})} />
    </>
  );
}
