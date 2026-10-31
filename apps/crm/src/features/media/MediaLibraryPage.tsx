import { Download, Images } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { formatBytes, formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { type MediaFilters, useMediaLibrary, useSignedUrls } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/lib/workspace";

const STATUS_VARIANT = {
  pending_review: "info",
  approved: "success",
  rejected: "destructive",
  outdated: "outline",
} as const;

/** Every rendered file in the workspace: what it is, which versions it came from, and whether it is approved. */
export function MediaLibraryPage() {
  const { t, locale } = useI18n();
  const { workspaceId } = useWorkspace();
  const [filters, setFilters] = useState<MediaFilters>({ type: "all", status: "all", search: "" });
  const media = useMediaLibrary(workspaceId, filters);
  const rows = media.data ?? [];
  const urls = useSignedUrls(
    rows.map((r) => r.storage_path),
    "media",
  );

  const download = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("media")
      .createSignedUrl(path, 60, { download: path.split("/").pop() });
    if (error || !data) return toast.error(error?.message ?? "download failed");
    window.location.assign(data.signedUrl);
  };

  return (
    <>
      <PageHeader title={t("nav.media")} subtitle={t("library.subtitle")} />
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <Input
          placeholder={t("library.search")}
          aria-label={t("library.search")}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <NativeSelect
          aria-label={t("library.type")}
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value as MediaFilters["type"] })}
        >
          {(["all", "png", "carousel_slide"] as const).map((v) => (
            <option key={v} value={v}>
              {t(`library.type.${v}` as MessageKey)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("library.status")}
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value as MediaFilters["status"] })
          }
        >
          <option value="all">{t("common.all")}</option>
          {(["pending_review", "approved", "rejected", "outdated"] as const).map((v) => (
            <option key={v} value={v}>
              {t(`media.asset.${v}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      {media.isLoading ? (
        <ListSkeleton rows={4} />
      ) : media.error ? (
        <ErrorState error={media.error} onRetry={() => media.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Images className="size-5" />} message={t("library.empty")} />
      ) : (
        <div
          className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
          data-testid="media-grid"
        >
          {rows.map((a) => (
            <Card key={a.id} className="gap-0 overflow-hidden py-0" data-testid="media-card">
              <Link
                to={`/projects/${a.project_id}`}
                className="relative block aspect-square border-b bg-muted"
              >
                {urls.data?.[a.storage_path] && (
                  <img
                    src={urls.data[a.storage_path]}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-contain"
                  />
                )}
              </Link>
              <CardContent className="flex flex-col gap-1.5 py-3 text-xs">
                <Link
                  to={`/projects/${a.project_id}`}
                  className="line-clamp-1 text-sm font-medium hover:underline"
                  dir={textDir(a.content_projects.title)}
                >
                  {a.content_projects.title}
                </Link>
                <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                  <span>
                    {a.slide_index ? t("media.slide", { n: a.slide_index }) : t("library.type.png")}
                  </span>
                  <span>·</span>
                  <span dir="ltr">
                    {a.width}×{a.height}
                  </span>
                  <span>·</span>
                  <span>{formatBytes(a.file_size)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={STATUS_VARIANT[a.status]}>{t(`media.asset.${a.status}`)}</Badge>
                  <Badge variant="outline">
                    {t("library.render", { n: a.render_jobs.version })}
                  </Badge>
                  <Badge variant="outline">
                    {t("library.creative", { n: a.creative_versions.version })}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                  <span>{formatRelative(a.created_at, locale)}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label={t("media.download")}
                    onClick={() => void download(a.storage_path)}
                  >
                    <Download />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
