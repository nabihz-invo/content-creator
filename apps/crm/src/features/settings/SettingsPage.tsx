import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { api } from "@/lib/api";
import { type Locale, useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/lib/workspace";

export function SettingsPage() {
  const { t, setLocale } = useI18n();
  const { profile, userId, workspaceName, role } = useWorkspace();
  const qc = useQueryClient();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [locale, setLoc] = useState<Locale>(profile?.locale ?? "en");
  useEffect(() => {
    setName(profile?.display_name ?? "");
    setLoc(profile?.locale ?? "en");
  }, [profile?.display_name, profile?.locale]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() || null, locale })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      setLocale(locale);
      void qc.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success(t("common.save"));
    },
    onError: (e) => toast.error(e.message),
  });

  const [code, setCode] = useState<string | null>(null);
  const link = useMutation({
    mutationFn: () => api.telegramLinkCode(),
    onSuccess: (r) => setCode(r.code),
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title={t("settings.title")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-name">{t("settings.displayName")}</Label>
                <Input
                  id="s-name"
                  dir="auto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-locale">{t("settings.language")}</Label>
                <NativeSelect
                  id="s-locale"
                  value={locale}
                  onChange={(e) => setLoc(e.target.value as Locale)}
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </NativeSelect>
              </div>
              <Button type="submit" className="w-fit" disabled={save.isPending}>
                {save.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.telegram")}</CardTitle>
            <CardDescription>
              {profile?.telegram_user_id
                ? t("settings.telegramLinked")
                : t("settings.telegramNotLinked")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {profile?.telegram_user_id && (
              <Badge variant="success">
                <CheckCircle2 /> Telegram
              </Badge>
            )}
            {code ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  {t("settings.telegramInstructions")}
                </p>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-lg tracking-widest"
                    dir="ltr"
                  >
                    /link {code}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("common.copy")}
                    onClick={() =>
                      void navigator.clipboard
                        ?.writeText(`/link ${code}`)
                        .then(() => toast.success(t("common.copied")))
                    }
                  >
                    <Copy />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => link.mutate()}
                disabled={link.isPending}
              >
                <Send />
                {t("settings.telegramCreateCode")}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.workspace")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t("settings.workspace")}</dt>
              <dd>{workspaceName}</dd>
              <dt className="text-muted-foreground">{t("settings.role")}</dt>
              <dd>{role ? t(`role.${role}`) : "—"}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
