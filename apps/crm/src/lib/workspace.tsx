import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { MemberRole, Profile, WorkspaceMembership } from "@/types/db";
import { useAuth } from "./auth";
import { useI18n } from "./i18n";
import { supabase } from "./supabase";

interface WorkspaceValue {
  userId: string;
  profile: Profile | null;
  workspaceId: string | null;
  workspaceName: string | null;
  role: MemberRole | null;
  can: (action: "edit" | "admin") => boolean;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { setLocale } = useI18n();
  const userId = session!.user.id;

  const profile = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, locale, telegram_user_id")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  const membership = useQuery({
    queryKey: ["membership", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces(id, name)")
        .eq("user_id", userId)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as WorkspaceMembership | null;
    },
  });

  // The profile's language preference wins once it's loaded.
  useEffect(() => {
    if (profile.data?.locale) setLocale(profile.data.locale);
  }, [profile.data?.locale, setLocale]);

  const role = membership.data?.role ?? null;
  const value: WorkspaceValue = {
    userId,
    profile: profile.data ?? null,
    workspaceId: membership.data?.workspace_id ?? null,
    workspaceName: membership.data?.workspaces?.name ?? null,
    role,
    can: (action) =>
      action === "admin" ? role === "admin" : role === "admin" || role === "editor",
    loading: profile.isLoading || membership.isLoading,
  };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
