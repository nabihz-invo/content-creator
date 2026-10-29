import { OVERVIEW_GROUPS } from "@cc/shared";
import { AlertTriangle, ArrowUpRight, Plus } from "lucide-react";
import { Link } from "react-router";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NewIdeaDialog } from "@/features/inbox/NewIdeaDialog";
import { formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useAttentionJobs, useProjects, useStatusCounts } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";

type Group = keyof typeof OVERVIEW_GROUPS;
const GROUP_ORDER: Group[] = [
  "awaiting_analysis",
  "awaiting_answers",
  "scripts_in_review",
  "creatives_in_review",
  "rendering",
  "media_in_review",
  "ready_to_publish",
  "scheduled",
  "published",
  "needs_attention",
];
/** Groups where a human must act — highlighted. */
const ACTION_GROUPS = new Set<Group>([
  "awaiting_answers",
  "scripts_in_review",
  "creatives_in_review",
  "media_in_review",
  "needs_attention",
]);

export function OverviewPage() {
  const { t, locale } = useI18n();
  const { workspaceId, can } = useWorkspace();
  const counts = useStatusCounts(workspaceId);
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

      {counts.isError ? (
        <ErrorState error={counts.error} onRetry={() => void counts.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {GROUP_ORDER.map((g) => {
            const n = counts.data?.groups[g] ?? 0;
            const highlight = ACTION_GROUPS.has(g) && n > 0;
            return (
              <Link
                key={g}
                to={`/inbox?group=${g}`}
                className={cn(
                  "group rounded-xl border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-sm",
                  highlight &&
                    (g === "needs_attention"
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-warning/50 bg-warning/5"),
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs leading-snug text-muted-foreground">
                    {t(`overview.group.${g}` as MessageKey)}
                  </span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100 rtl:-scale-x-100" />
                </div>
                {counts.isLoading ? (
                  <Skeleton className="mt-2 h-8 w-10" />
                ) : (
                  <div className="mt-2 text-3xl font-semibold tabular-nums">{n}</div>
                )}
              </Link>
            );
          })}
        </div>
      )}

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
                      <StatusBadge status={p.status} />
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
