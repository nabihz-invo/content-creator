import { FolderKanban, Languages, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabaseConfigured } from "@/lib/supabase";

export function LoginPage() {
  const { t, locale, setLocale } = useI18n();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      await signInWithEmail(email.trim());
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("idle");
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-primary/10 via-background to-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <FolderKanban className="size-4" />
            </div>
            <div className="font-semibold">{t("app.name")}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          >
            <Languages />
            {t("lang.switch")}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("auth.title")}</CardTitle>
            <CardDescription>{t("auth.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {!supabaseConfigured && (
              <p className="mb-4 rounded-md bg-warning/15 p-3 text-sm">{t("auth.notConfigured")}</p>
            )}
            {state === "sent" ? (
              <div className="flex items-start gap-3 rounded-md bg-success/10 p-4 text-sm">
                <MailCheck className="mt-0.5 size-4 shrink-0 text-success" />
                {t("auth.sent")}
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={state === "sending" || !email}>
                  {state === "sending" ? t("common.loading") : t("auth.send")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
