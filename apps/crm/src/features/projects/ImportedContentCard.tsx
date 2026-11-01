import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, FileSpreadsheet, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useImportedMedia } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";
import type { ContentProject } from "@/types/db";
import { FinishedMedia } from "./FinishedMedia";

type LinkLanguage = "en" | "ar" | "both";

/** The live links of an imported project, one per language version (older rows: one link for both). */
export function liveLinks(project: ContentProject) {
  const meta = project.source_metadata;
  const links = meta.published_links ?? (meta.published ? { both: meta.published } : {});
  return Object.entries(links) as [LinkLanguage, { url: string; at: string }][];
}

/**
 * A row imported from an existing content plan: its plan details, its finished files, and closing
 * it with the live post's link(s), which can also free the files' storage (P4-T10, P5-T15).
 */
export function ImportedContentCard({ project }: { project: ContentProject }) {
  const { t, locale } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
  const meta = project.source_metadata;
  const media = useImportedMedia(meta.origin === "content_plan_import" ? project.id : undefined);
  const links = liveLinks(project);
  const linked = new Set(links.map(([l]) => l));
  const versions = [
    ...new Set((media.data ?? []).map((m) => m.language).filter((l) => l !== null)),
  ];
  // Languages that can still get a link: none once "both" is set.
  const open: LinkLanguage[] = linked.has("both")
    ? []
    : versions.length > 1
      ? (["en", "ar"] as const).filter((l) => !linked.has(l))
      : linked.size
        ? []
        : ["both"];
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState<LinkLanguage>(
    open.length > 1 && !linked.size ? "both" : (open[0] ?? "both"),
  );
  const [release, setRelease] = useState(true);
  // Default to the planned day, unless that is still in the future.
  const today = new Date().toISOString().slice(0, 10);
  const planned = meta.publish_date?.slice(0, 10);
  const [date, setDate] = useState(planned && planned <= today ? planned : today);
  const hasStored = (media.data ?? []).some((m) => m.storage_path);
  const mark = useMutation({
    mutationFn: () =>
      api.markImportedPublished(project.id, url.trim(), {
        publishedAt: date || undefined,
        language: versions.length ? language : undefined,
        releaseStorage: hasStored && release,
      }),
    onSuccess: (r) => {
      toast.success(
        r.released?.released
          ? t("imported.doneReleased", { mb: (r.released.bytes / 1e6).toFixed(1) })
          : t("imported.done"),
      );
      setUrl("");
      for (const key of [
        "project",
        "project-events",
        "status-counts",
        "projects",
        "imported-media",
      ])
        void qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(e.message),
  });
  if (meta.origin !== "content_plan_import") return null;
  const canLink =
    can("edit") && (project.status === "new" || project.status === "published") && open.length > 0;

  return (
    <Card data-testid="imported-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="size-4" />
          {t("imported.title")}
        </CardTitle>
        <CardDescription>
          {t("imported.subtitle", { file: meta.source_file ?? "" })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="flex flex-wrap gap-2">
          {meta.plan_id && (
            <Badge variant="info" dir="ltr">
              {meta.plan_id}
            </Badge>
          )}
          {meta.format && <Badge variant="secondary">{meta.format}</Badge>}
          {meta.publish_date && (
            <Badge variant="outline">
              {t("imported.planned", { date: meta.publish_date.slice(0, 10) })}
            </Badge>
          )}
          {meta.plan_status && <Badge variant="outline">{meta.plan_status}</Badge>}
        </div>

        {links.map(([lang, link]) => (
          <div key={lang} className="flex flex-wrap items-center gap-2 text-success">
            <CheckCircle2 className="size-4" />
            {lang !== "both" && <Badge variant="outline">{t(`imported.lang.${lang}`)}</Badge>}
            {t("imported.publishedOn", { date: formatDateTime(link.at, locale) })}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 text-primary hover:underline"
              dir="ltr"
            >
              {link.url}
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        ))}

        {canLink && (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="imported-url">{t("imported.url")}</Label>
              <Input
                id="imported-url"
                dir="ltr"
                placeholder="https://"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="imported-date">{t("imported.date")}</Label>
              <Input
                id="imported-date"
                type="date"
                dir="ltr"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button
              onClick={() => mark.mutate()}
              disabled={!/^https:\/\/\S+$/.test(url.trim()) || mark.isPending}
            >
              <Send />
              {t("imported.markPublished")}
            </Button>
            {versions.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="imported-lang">{t("imported.linkFor")}</Label>
                <NativeSelect
                  id="imported-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LinkLanguage)}
                >
                  {(!linked.size ? (["both", "en", "ar"] as const) : open).map((l) => (
                    <option key={l} value={l}>
                      {t(`imported.lang.${l}`)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
            {hasStored && (
              <label className="flex items-center gap-2 text-xs sm:col-span-2 sm:self-end">
                <Checkbox checked={release} onCheckedChange={(v) => setRelease(v === true)} />
                {t("imported.releaseOnLink")}
              </label>
            )}
            <p className="text-xs text-muted-foreground sm:col-span-3">{t("imported.hint")}</p>
          </div>
        )}

        <FinishedMedia project={project} media={media.data ?? []} links={links} />
      </CardContent>
    </Card>
  );
}
