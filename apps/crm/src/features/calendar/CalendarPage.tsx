import { useNavigate } from "react-router";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/States";
import { useI18n } from "@/lib/i18n";
import { type CalendarPost, useTeamCalendar } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";
import { CalendarMonth, LegendDot } from "./CalendarMonth";

/** Where a post stands for the team, client decision included. */
function teamDot(p: CalendarPost) {
  if (p.status === "published") return "bg-muted-foreground";
  if (p.review?.status === "changes_requested") return "bg-destructive";
  if (p.status === "scheduled" || p.status === "publishing") return "bg-primary";
  if (p.review?.status === "approved")
    return p.client_review?.status === "approved" ? "bg-success" : "bg-warning";
  return "bg-border";
}

/** The team's publishing calendar: every planned post on its date; a click opens the post. */
export function CalendarPage() {
  const { t } = useI18n();
  const { workspaceId } = useWorkspace();
  const posts = useTeamCalendar(workspaceId);
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title={t("nav.calendar")} subtitle={t("calendar.teamSubtitle")} />
      {posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => void posts.refetch()} />
      ) : posts.isLoading ? (
        <ListSkeleton rows={6} />
      ) : (
        <CalendarMonth
          posts={posts.data ?? []}
          dot={teamDot}
          onOpen={(p) => void navigate(`/projects/${p.id}`)}
          legend={
            <>
              <LegendDot className="bg-border" label={t("calendar.legend.inProgress")} />
              <LegendDot className="bg-warning" label={t("calendar.legend.withClient")} />
              <LegendDot className="bg-success" label={t("calendar.legend.clientApproved")} />
              <LegendDot className="bg-destructive" label={t("calendar.legend.changes")} />
              <LegendDot className="bg-primary" label={t("calendar.legend.scheduled")} />
              <LegendDot className="bg-muted-foreground" label={t("calendar.legend.published")} />
            </>
          }
        />
      )}
    </>
  );
}
