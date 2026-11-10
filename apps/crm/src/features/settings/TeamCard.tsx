import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ErrorState, ListSkeleton } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useI18n } from "@/lib/i18n";
import { useBrands } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/lib/workspace";
import type { MemberRole, WorkspaceMember } from "@/types/db";

const ROLES: MemberRole[] = ["admin", "editor", "reviewer"];

/** Admins add people to the workspace and choose which brands each person works on. */
export function TeamCard() {
  const { t } = useI18n();
  const { workspaceId, userId } = useWorkspace();
  const brands = useBrands(workspaceId);
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<MemberRole>("editor");
  const key = ["workspace-members", workspaceId];

  const members = useQuery({
    queryKey: key,
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_workspace_members", {
        p_workspace_id: workspaceId,
      });
      if (error) throw error;
      return (data ?? []) as WorkspaceMember[];
    },
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: key });
  const fail = (e: Error) => toast.error(e.message);

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("add_workspace_member", {
        p_workspace_id: workspaceId,
        p_email: email.trim(),
        p_role: newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEmail("");
      refresh();
    },
    onError: (e) => {
      if (e.message.startsWith("no_account")) toast.error(t("team.noAccount"));
      else if (e.message.startsWith("already_member")) toast.error(t("team.alreadyMember"));
      else fail(e);
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ user, role }: { user: string; role: MemberRole }) => {
      const { error } = await supabase
        .from("workspace_members")
        .update({ role })
        .eq("workspace_id", workspaceId!)
        .eq("user_id", user);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: fail,
  });

  const toggleBrand = useMutation({
    mutationFn: async ({ user, brand, on }: { user: string; brand: string; on: boolean }) => {
      const { error } = on
        ? await supabase
            .from("brand_members")
            .insert({ brand_id: brand, user_id: user, created_by: userId })
        : await supabase.from("brand_members").delete().eq("brand_id", brand).eq("user_id", user);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: async (user: string) => {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspaceId!)
        .eq("user_id", user);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: fail,
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (email.trim()) add.mutate();
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{t("team.title")}</CardTitle>
        <CardDescription>{t("team.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end" onSubmit={submit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="team-email">{t("team.email")}</Label>
            <Input
              id="team-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="team-role">{t("team.role")}</Label>
            <NativeSelect
              id="team-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as MemberRole)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`role.${r}`)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit" disabled={!email.trim() || add.isPending}>
            <UserPlus />
            {t("team.add")}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">{t("team.signInFirst")}</p>

        {members.isError ? (
          <ErrorState error={members.error} onRetry={() => void members.refetch()} />
        ) : members.isLoading ? (
          <ListSkeleton rows={2} />
        ) : (
          <ul className="divide-y rounded-lg border">
            {members.data?.map((m) => {
              const self = m.user_id === userId;
              return (
                <li key={m.user_id} className="flex flex-col gap-3 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" dir="auto">
                        {m.display_name || m.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        {m.email}
                      </p>
                    </div>
                    <NativeSelect
                      aria-label={t("team.role")}
                      className="w-44"
                      value={m.role}
                      disabled={self}
                      onChange={(e) =>
                        setRole.mutate({ user: m.user_id, role: e.target.value as MemberRole })
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {t(`role.${r}`)}
                        </option>
                      ))}
                    </NativeSelect>
                    {!self && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("common.remove")}
                        onClick={() => {
                          if (window.confirm(t("team.removeConfirm"))) remove.mutate(m.user_id);
                        }}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                  {m.role === "admin" ? (
                    <Badge variant="secondary" className="w-fit">
                      {t("team.allBrands")}
                    </Badge>
                  ) : (
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {brands.data?.map((b) => {
                        const id = `team-${m.user_id}-${b.id}`;
                        return (
                          <div key={b.id} className="flex items-center gap-2">
                            <Checkbox
                              id={id}
                              checked={m.brand_ids.includes(b.id)}
                              disabled={toggleBrand.isPending}
                              onCheckedChange={(v) =>
                                toggleBrand.mutate({ user: m.user_id, brand: b.id, on: v === true })
                              }
                            />
                            <Label htmlFor={id} dir="auto">
                              {b.name}
                            </Label>
                          </div>
                        );
                      })}
                      {m.brand_ids.length === 0 && (
                        <Badge variant="outline">{t("team.noBrands")}</Badge>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
