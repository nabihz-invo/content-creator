import { STAGES } from "@cc/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDateTime, formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { type MonitorJob, useMonitorJobs } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";

const JOB_STATUSES = [
  "needs_attention",
  "running",
  "queued",
  "failed",
  "succeeded",
  "cancelled",
] as const;
const VARIANT = {
  queued: "secondary",
  running: "info",
  succeeded: "success",
  failed: "warning",
  needs_attention: "destructive",
  cancelled: "outline",
} as const;

function duration(j: MonitorJob): string | null {
  if (!j.started_at) return null;
  const s = Math.round(
    ((j.completed_at ? Date.parse(j.completed_at) : Date.now()) - Date.parse(j.started_at)) / 1000,
  );
  return s < 120 ? `${s}s` : `${Math.round(s / 60)}m`;
}

/** Live view of the job queue (blueprint §11): stage, attempts, errors, related versions; admins retry/cancel. */
export function MonitorPage() {
  const { t, locale } = useI18n();
  const { workspaceId, can } = useWorkspace();
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [stage, setStage] = useState("all");
  const jobs = useMonitorJobs(workspaceId, status, stage);
  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "retry" | "cancel" }) =>
      action === "retry" ? api.retryJob(id) : api.cancelJob(id),
    onSuccess: (_r, v) => {
      toast.success(t(v.action === "retry" ? "monitor.retried" : "monitor.cancelled"));
      for (const key of [
        "monitor",
        "project",
        "project-jobs",
        "attention",
        "status-counts",
        "renders",
      ])
        void qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title={t("nav.monitor")} subtitle={t("monitor.subtitle")} />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-48">
          <NativeSelect
            aria-label={t("monitor.status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">{t("monitor.all")}</option>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`job.status.${s}` as MessageKey)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="w-48">
          <NativeSelect
            aria-label={t("monitor.stage")}
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="all">{t("monitor.all")}</option>
            {STAGES.filter((s) => !s.endsWith("_review")).map((s) => (
              <option key={s} value={s}>
                {t(`stage.${s}` as MessageKey)}
              </option>
            ))}
          </NativeSelect>
        </div>
        {!can("admin") && (
          <p className="self-center text-xs text-muted-foreground">{t("monitor.adminOnly")}</p>
        )}
      </div>
      {jobs.isLoading ? (
        <ListSkeleton rows={6} />
      ) : jobs.error ? (
        <ErrorState error={jobs.error} onRetry={() => jobs.refetch()} />
      ) : !jobs.data?.length ? (
        <EmptyState message={t("monitor.empty")} />
      ) : (
        <Table data-testid="monitor-table">
          <TableHeader>
            <TableRow>
              <TableHead>{t("monitor.job")}</TableHead>
              <TableHead>{t("monitor.project")}</TableHead>
              <TableHead>{t("monitor.attempts")}</TableHead>
              <TableHead>{t("monitor.timing")}</TableHead>
              <TableHead>{t("monitor.error")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.data.map((j) => {
              const err = j.error_details as { code?: string; message?: string } | null;
              const ref = { ...(j.input_reference ?? {}), ...(j.output_reference ?? {}) } as Record<
                string,
                unknown
              >;
              return (
                <TableRow key={j.id} data-testid="monitor-row" data-status={j.status}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t(`stage.${j.stage}` as MessageKey)}</span>
                        <Badge variant={VARIANT[j.status]}>
                          {t(`job.status.${j.status}` as MessageKey)}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t(`monitor.kind.${j.kind}` as MessageKey)}
                        {typeof ref.version === "number" && ` · v${ref.version}`}
                        {typeof ref.manifest_hash === "string" && (
                          <span className="font-mono" dir="ltr">
                            {" "}
                            · {ref.manifest_hash.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56">
                    <Link
                      to={`/projects/${j.project_id}`}
                      className="line-clamp-2 hover:underline"
                      dir={textDir(j.content_projects.title)}
                    >
                      {j.content_projects.title}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {j.attempts}/{j.max_attempts}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div title={formatDateTime(j.created_at, locale)}>
                      {formatRelative(j.created_at, locale)}
                    </div>
                    {duration(j) && (
                      <div dir="ltr" className="text-start">
                        {duration(j)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-72 text-xs">
                    {err?.message ? (
                      <span className="line-clamp-2 text-destructive" dir="ltr" title={err.message}>
                        {err.code ? `${err.code}: ` : ""}
                        {err.message}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {can("admin") && (
                      <div className="flex justify-end gap-1">
                        {["needs_attention", "failed", "cancelled"].includes(j.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => act.mutate({ id: j.id, action: "retry" })}
                            disabled={act.isPending}
                          >
                            <RotateCcw />
                            {t("monitor.retry")}
                          </Button>
                        )}
                        {["queued", "running", "failed", "needs_attention"].includes(j.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => act.mutate({ id: j.id, action: "cancel" })}
                            disabled={act.isPending}
                          >
                            <Ban />
                            {t("monitor.cancel")}
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}
