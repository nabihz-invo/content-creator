import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, FileSpreadsheet, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import type { ContentProject } from "@/types/db";

/** A row imported from an existing content plan: its plan details, and closing it with the live post's link. */
export function ImportedContentCard({ project }: { project: ContentProject }) {
  const { t, locale } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
  const meta = project.source_metadata;
  const [url, setUrl] = useState("");
  // Default to the planned day, unless that is still in the future.
  const today = new Date().toISOString().slice(0, 10);
  const planned = meta.publish_date?.slice(0, 10);
  const [date, setDate] = useState(planned && planned <= today ? planned : today);
  const mark = useMutation({
    mutationFn: () => api.markImportedPublished(project.id, url.trim(), date || undefined),
    onSuccess: () => {
      toast.success(t("imported.done"));
      for (const key of ["project", "project-events", "status-counts", "projects"])
        void qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(e.message),
  });
  if (meta.origin !== "content_plan_import") return null;

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
        {meta.published ? (
          <div className="flex flex-wrap items-center gap-2 text-success">
            <CheckCircle2 className="size-4" />
            {t("imported.publishedOn", { date: formatDateTime(meta.published.at, locale) })}
            <a
              href={meta.published.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 text-primary hover:underline"
              dir="ltr"
            >
              {meta.published.url}
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        ) : project.status === "new" && can("edit") ? (
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
            <p className="text-xs text-muted-foreground sm:col-span-3">{t("imported.hint")}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
