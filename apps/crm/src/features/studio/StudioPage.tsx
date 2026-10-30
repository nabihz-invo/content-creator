import { Palette } from "lucide-react";
import { Link } from "react-router";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { type StudioRow, useSignedUrls, useStudioProjects } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";

const latest = (row: StudioRow) =>
  [...row.creative_versions].sort((a, b) => b.version - a.version)[0] ?? null;

/** Projects whose creative is being built, waiting for review, or approved and rendering. */
export function StudioPage() {
  const { t, locale } = useI18n();
  const { workspaceId } = useWorkspace();
  const projects = useStudioProjects(workspaceId);
  const rows = projects.data ?? [];
  const thumbPaths = rows.flatMap((r) => {
    const p = latest(r)?.configuration.thumbnails?.[0]?.path;
    return p ? [p] : [];
  });
  const thumbs = useSignedUrls(thumbPaths);

  return (
    <>
      <PageHeader title={t("nav.creative")} subtitle={t("studio.subtitle")} />
      {projects.isLoading ? (
        <ListSkeleton rows={4} />
      ) : projects.error ? (
        <ErrorState error={projects.error} onRetry={() => projects.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Palette className="size-5" />} message={t("studio.empty")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="studio-grid">
          {rows.map((row) => {
            const cv = latest(row);
            const thumb = cv?.configuration.thumbnails?.[0]?.path;
            const url = thumb ? thumbs.data?.[thumb] : undefined;
            return (
              <Card key={row.id} className="gap-0 overflow-hidden py-0" data-testid="studio-card">
                <div className="relative flex aspect-[4/3] items-center justify-center bg-muted">
                  {url ? (
                    <img src={url} alt="" className="absolute inset-0 size-full object-contain" />
                  ) : (
                    <Palette className="size-8 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 font-medium" dir={textDir(row.title)}>
                      {row.title}
                    </p>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {cv && <Badge variant="outline">v{cv.version}</Badge>}
                      {cv?.configuration.format && <span>{cv.configuration.format}</span>}
                    </span>
                    <span>{formatRelative(row.updated_at, locale)}</span>
                  </div>
                  <Button asChild size="sm" variant="secondary" className="w-full">
                    <Link to={`/projects/${row.id}`}>{t("studio.open")}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
