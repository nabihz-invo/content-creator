import { buildCreativePrompt } from "@cc/shared";
import { Copy, Wand2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useBrand, useCurrentBrief, useScripts } from "@/lib/queries";
import type { ContentProject } from "@/types/db";

/** Shows the deterministic Claude Code prompt for the approved script (ADR-0006 §6). */
export function CreativePromptPanel({ project }: { project: ContentProject }) {
  const { t } = useI18n();
  const scripts = useScripts(project.id);
  const brief = useCurrentBrief(project.id);
  const brand = useBrand(project.brand_id ?? undefined);
  const approved = scripts.data?.find((s) => s.status === "approved");

  const creative = useMemo(() => {
    if (
      !approved ||
      !brief.data ||
      brief.data.id !== approved.brief_id ||
      brief.data.validation_status !== "valid"
    )
      return null;
    const b = brand.data;
    return buildCreativePrompt({
      brief: brief.data.brief,
      script: approved.content,
      brand: b
        ? { name: b.name, default_language: b.default_language, settings: b.brand_settings }
        : null,
    });
  }, [approved, brief.data, brand.data]);

  if (!creative)
    return <EmptyState icon={<Wand2 className="size-5" />} message={t("creative.none")} />;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{t("creative.title")}</CardTitle>
          <CardDescription>{t("creative.subtitle")}</CardDescription>
          <div className="mt-2 text-xs text-muted-foreground" dir="ltr">
            {t("creative.meta", {
              format: t(`contentType.${creative.format}` as MessageKey),
              w: creative.width,
              h: creative.height,
              version: creative.version,
            })}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void navigator.clipboard
              ?.writeText(creative.prompt)
              .then(() => toast.success(t("common.copied")))
          }
        >
          <Copy />
          {t("creative.copy")}
        </Button>
      </CardHeader>
      <CardContent>
        <pre
          className="max-h-[70dvh] overflow-auto rounded-lg bg-muted/60 p-4 text-xs leading-relaxed whitespace-pre-wrap"
          dir="ltr"
          data-testid="creative-prompt"
        >
          {creative.prompt}
        </pre>
      </CardContent>
    </Card>
  );
}
