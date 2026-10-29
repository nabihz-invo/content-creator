import {
  CalendarDays,
  Clapperboard,
  FolderKanban,
  Gauge,
  Images,
  Inbox,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Palette,
  Settings,
  Sun,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ComponentType } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
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
import type { MessageKey } from "@/lib/i18n/en";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";

interface NavItem {
  to: string;
  label: MessageKey;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const SECTIONS: { label: MessageKey; items: NavItem[] }[] = [
  {
    label: "nav.section.content",
    items: [
      { to: "/", label: "nav.overview", icon: LayoutDashboard, end: true },
      { to: "/inbox", label: "nav.inbox", icon: Inbox },
      { to: "/brands", label: "nav.brands", icon: Palette },
    ],
  },
  {
    label: "nav.section.production",
    items: [
      { to: "/creative", label: "nav.creative", icon: Clapperboard },
      { to: "/media", label: "nav.media", icon: Images },
      { to: "/calendar", label: "nav.calendar", icon: CalendarDays },
    ],
  },
  {
    label: "nav.section.system",
    items: [
      { to: "/monitor", label: "nav.monitor", icon: Gauge },
      { to: "/settings", label: "nav.settings", icon: Settings },
    ],
  },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  return (
    <nav className="flex flex-col gap-6 px-3" aria-label={t("nav.menu")}>
      {SECTIONS.map((section) => (
        <div key={section.label}>
          <div className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
            {t(section.label)}
          </div>
          <ul className="flex flex-col gap-0.5">
            {section.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-active",
                      isActive && "bg-sidebar-accent font-medium text-sidebar-active",
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  {t(label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5 px-6 py-5">
      <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <FolderKanban className="size-4" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-sidebar-active">{t("app.name")}</div>
        <div className="text-[11px] text-sidebar-foreground/60">{t("app.tagline")}</div>
      </div>
    </div>
  );
}

export function AppShell() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, toggle } = useTheme();
  const { signOut, session } = useAuth();
  const { profile, workspaceName, role, userId } = useWorkspace();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  // The language toggle is a profile preference, so it follows the user across devices.
  async function toggleLanguage() {
    const next = locale === "ar" ? "en" : "ar";
    setLocale(next);
    const { error } = await supabase.from("profiles").update({ locale: next }).eq("id", userId);
    if (!error) void qc.invalidateQueries({ queryKey: ["profile", userId] });
  }
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-sidebar lg:flex">
        <Brand />
        <Nav />
      </aside>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-y-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-sidebar pb-6 shadow-xl lg:hidden",
              dir === "rtl" ? "right-0" : "left-0",
            )}
            aria-describedby={undefined}
          >
            <DialogPrimitive.Title className="sr-only">{t("nav.menu")}</DialogPrimitive.Title>
            <Brand />
            <Nav onNavigate={() => setOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label={t("nav.menu")}
          >
            <Menu />
          </Button>
          <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {workspaceName}
          </div>
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
                {role && <div className="mt-1">{t(`role.${role}`)}</div>}
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
    </div>
  );
}
