import {
  Ban,
  CircleCheck,
  Clapperboard,
  FileCode2,
  Lightbulb,
  RotateCcw,
  Send,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router";
import { ErrorState } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useStageCounts } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import { FLOW_STAGES, type InboxStage, SIDE_STAGES } from "./stages";

const STAGE_STYLE: Record<
  InboxStage,
  {
    color: string;
    Icon: typeof Lightbulb;
    variant: "info" | "warning" | "success" | "destructive" | "secondary" | "outline";
  }
> = {
  new: { color: "#8A9AAB", Icon: Lightbulb, variant: "secondary" },
  content: { color: "#2F86B8", Icon: FileCode2, variant: "info" },
  media: { color: "#0895A6", Icon: Clapperboard, variant: "info" },
  declined: { color: "#D9822B", Icon: RotateCcw, variant: "warning" },
  ready: { color: "#2E9E6B", Icon: Send, variant: "success" },
  published: { color: "#2C5974", Icon: CircleCheck, variant: "success" },
  failed: { color: "#D64545", Icon: TriangleAlert, variant: "destructive" },
  cancelled: { color: "#8A9AAB", Icon: Ban, variant: "outline" },
};

export function StageBadge({ stage }: { stage: InboxStage }) {
  const { t } = useI18n();
  return <Badge variant={STAGE_STYLE[stage].variant}>{t(`inbox.stage.${stage}.title`)}</Badge>;
}

/** The heading of an opened stage. */
export function StageHeading({ stage, total }: { stage: InboxStage; total?: number }) {
  const { t } = useI18n();
  const { color, Icon } = STAGE_STYLE[stage];
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">
          {t(`inbox.stage.${stage}.title`)}
          {total !== undefined && (
            <span className="ms-2 font-normal text-muted-foreground tabular-nums">{total}</span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">{t(`inbox.stage.${stage}.help`)}</p>
      </div>
    </div>
  );
}

/** The inbox's first view: one card per stage with its count. No idea is loaded until one is opened. */
export function StageCards() {
  const { t } = useI18n();
  const { workspaceId } = useWorkspace();
  const counts = useStageCounts(workspaceId);

  if (counts.isError)
    return <ErrorState error={counts.error} onRetry={() => void counts.refetch()} />;

  const side = SIDE_STAGES.filter((s) => (counts.data?.[s] ?? 0) > 0);
  return (
    <>
      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FLOW_STAGES.map((stage, i) => {
          const { color, Icon } = STAGE_STYLE[stage];
          const n = counts.data?.[stage] ?? 0;
          return (
            <li key={stage}>
              <Link
                to={`/inbox?stage=${stage}`}
                className="flex h-full flex-col gap-3 rounded-xl border border-t-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                style={{ borderTopColor: color }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {counts.isLoading ? (
                    <Skeleton className="h-9 w-12" />
                  ) : (
                    <span
                      className={cn(
                        "text-3xl font-semibold tabular-nums",
                        n === 0 && "text-muted-foreground",
                      )}
                    >
                      {n}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">
                    <span className="me-1.5 text-muted-foreground tabular-nums">{i + 1}.</span>
                    {t(`inbox.stage.${stage}.title`)}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`inbox.stage.${stage}.help`)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      {side.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {side.map((stage) => {
            const { color, Icon } = STAGE_STYLE[stage];
            return (
              <Link
                key={stage}
                to={`/inbox?stage=${stage}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Icon className="size-4" style={{ color }} aria-hidden />
                {t(`inbox.stage.${stage}.title`)}
                <span className="tabular-nums">{counts.data?.[stage]}</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
