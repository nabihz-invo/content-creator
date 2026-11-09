import { AlertTriangle, Plus } from "lucide-react";
import { Link } from "react-router";
import { ListSkeleton, PageHeader } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewIdeaDialog } from "@/features/inbox/NewIdeaDialog";
import { StageBadge, StageCards } from "@/features/inbox/StageCards";
import { formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useAttentionJobs, useProjects } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";

export function OverviewPage() {
  const { t, locale } = useI18n();
  const { workspaceId, can } = useWorkspace();
  const recent = useProjects(workspaceId, { page: 0 });
  const attention = useAttentionJobs(workspaceId);

  return (
    <>
      <PageHeader
        title={t("overview.title")}
        subtitle={t("overview.subtitle")}
        actions={
          can("edit") && (
            <NewIdeaDialog>
              <Button>
                <Plus />
                {t("overview.newIdea")}
              </Button>
            </NewIdeaDialog>
          )
        }
      />

      <StageCards />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("overview.recent")}</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link to="/inbox">{t("nav.inbox")}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.isLoading ? (
              <ListSkeleton rows={4} />
            ) : recent.data?.rows.length ? (
              <ul className="divide-y">
                {recent.data.rows.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/projects/${p.id}`}
                      className="flex items-center gap-3 py-3 hover:opacity-80"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium" dir={textDir(p.title)}>
                          {p.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t(`source.${p.input_source}`)} · {formatRelative(p.submitted_at, locale)}
                        </div>
                      </div>
                      <StageBadge stage={p.inbox_stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("inbox.emptyAll")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              {t("overview.attention")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attention.isLoading ? (
              <ListSkeleton rows={2} />
            ) : attention.data?.length ? (
              <ul className="flex flex-col gap-3">
                {attention.data.map((j) => (
                  <li key={j.id} className="rounded-lg border border-destructive/20 p-3">
                    <Link
                      to={`/projects/${j.project_id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {j.content_projects.title}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {j.stage} ·{" "}
                      {String(
                        (j.error_details as { message?: string; code?: string } | null)?.message ??
                          (j.error_details as { code?: string } | null)?.code ??
                          "",
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("overview.attentionEmpty")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
