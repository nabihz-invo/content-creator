import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  GitCommit,
  Loader2,
  MessageSquareWarning,
  RotateCcw,
  ShieldCheck,
  Shuffle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import {
  type CreativeVersionRow,
  useApprovals,
  useCreativeVersions,
  useSignedUrls,
  WORKING_STATUSES,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { ContentProject } from "@/types/db";
import { CreativePromptPanel } from "../CreativePromptPanel";
import { SandboxedPreview } from "./SandboxedPreview";

const VARIANT: Record<
  CreativeVersionRow["status"],
  "info" | "warning" | "success" | "destructive" | "outline" | "secondary"
> = {
  generating: "secondary",
  in_review: "info",
  changes_requested: "warning",
  approved: "success",
  rejected: "destructive",
  superseded: "outline",
  failed: "destructive",
};

function commitUrl(repo: string | null, sha: string | null) {
  if (!repo || !sha) return null;
  return /^https:\/\/github\.com\//.test(repo)
    ? `${repo.replace(/\.git$/, "")}/commit/${sha}`
    : null;
}

export function CreativePanel({ project }: { project: ContentProject }) {
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const creatives = useCreativeVersions(project.id, WORKING_STATUSES.has(project.status));
  const approvals = useApprovals(project.id);
  const [selected, setSelected] = useState<string | null>(null);
  const [frame, setFrame] = useState<string>(""); // "" | "?slide=N" | "?t=X"
  const [reload, setReload] = useState(0);
  const [dialog, setDialog] = useState<null | "changes" | "fresh">(null);
  const [comment, setComment] = useState("");

  const list = creatives.data ?? [];
  const current = list.find((c) => c.id === selected) ?? list[0];
  const cfg = current?.configuration ?? {};
  const preview = useQuery({
    queryKey: ["preview-url", current?.id],
    enabled: !!current?.preview_path,
    staleTime: 20 * 60_000,
    queryFn: () => api.previewUrl(current!.id),
  });
  const thumbs = useSignedUrls((cfg.thumbnails ?? []).map((th) => th.path));
  const actionable = current?.status === "in_review" && project.status === "creative_in_review";

  const decide = useMutation({
    mutationFn: (input: {
      decision: "approved" | "changes_requested" | "rejected";
      comment?: string;
    }) =>
      api.decide({
        artifact_type: "creative_version",
        artifact_id: current!.id,
        artifact_version: current!.version,
        artifact_hash: current!.content_hash!,
        ...input,
      }),
    onSuccess: (_r, input) => {
      toast.success(
        input.decision === "approved"
          ? t("creative.approvedToast")
          : input.decision === "changes_requested"
            ? t("creative.changesSent")
            : t("creative.newDirectionSent"),
      );
      setDialog(null);
      setComment("");
      setSelected(null);
      for (const key of [
        "project",
        "creatives",
        "approvals",
        "project-events",
        "project-jobs",
        "status-counts",
        "studio",
      ])
        void qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(e.message),
  });

  const building = project.status === "generating_creative";

  return (
    <div className="flex flex-col gap-4">
      {building && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3">
            <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
            <div>
              <div className="font-medium">{t("creative.building")}</div>
              <p className="mt-1 text-sm text-muted-foreground">{t("creative.buildingBody")}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {project.status === "rendering" && (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-5 text-success" />
            {t("creative.rendering")}
          </CardContent>
        </Card>
      )}

      {!current && !building && (
        <p className="text-sm text-muted-foreground">{t("creative.empty")}</p>
      )}

      {current && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {list.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelected(c.id);
                  setFrame("");
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition hover:border-primary/40",
                  c.id === current.id && "border-primary bg-primary/5",
                )}
              >
                {t("creative.version", { n: c.version })}
                <Badge variant={VARIANT[c.status]}>
                  {t(`creative.status.${c.status}` as MessageKey)}
                </Badge>
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <Card>
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{t("creative.preview")}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    {t("creative.previewNote")}
                  </CardDescription>
                </div>
                {actionable && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDialog("fresh")}>
                      <Shuffle />
                      {t("creative.newDirection")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDialog("changes")}>
                      <MessageSquareWarning />
                      {t("creative.requestChanges")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => decide.mutate({ decision: "approved" })}
                      disabled={decide.isPending}
                    >
                      {decide.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                      {t("creative.approve")}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {cfg.format === "carousel" && (cfg.thumbnails?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cfg.thumbnails!.map((th, i) => (
                      <Button
                        key={th.name}
                        size="sm"
                        variant={frame === th.query || (!frame && i === 0) ? "default" : "outline"}
                        onClick={() => setFrame(th.query)}
                      >
                        {t("creative.slide", { n: i + 1 })}
                      </Button>
                    ))}
                  </div>
                )}
                {cfg.format === "video" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    onClick={() => setReload((r) => r + 1)}
                  >
                    <RotateCcw />
                    {t("creative.replay")}
                  </Button>
                )}
                {preview.isError ? (
                  <p className="text-sm text-destructive">{t("creative.previewError")}</p>
                ) : preview.data && cfg.width && cfg.height ? (
                  <SandboxedPreview
                    key={`${current.id}-${reload}`}
                    src={`${preview.data.url}${frame}`}
                    width={cfg.width}
                    height={cfg.height}
                    title={t("creative.version", { n: current.version })}
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {(cfg.thumbnails?.length ?? 0) > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("creative.stills")}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {cfg.thumbnails!.map((th) => (
                        <button
                          key={th.name}
                          type="button"
                          onClick={() => setFrame(th.query)}
                          className={cn(
                            "shrink-0 overflow-hidden rounded-md border-2 transition",
                            frame === th.query
                              ? "border-primary"
                              : "border-transparent hover:border-primary/40",
                          )}
                          aria-label={th.name}
                        >
                          {thumbs.data?.[th.path] ? (
                            <img
                              src={thumbs.data[th.path]}
                              alt={th.name}
                              className="h-28 w-auto"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-28 w-20 animate-pulse bg-muted" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("creative.details")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  {cfg.format && (
                    <Badge variant="info">{t(`contentType.${cfg.format}` as MessageKey)}</Badge>
                  )}
                  {cfg.width && (
                    <Badge variant="secondary" dir="ltr">
                      {cfg.width}×{cfg.height}
                    </Badge>
                  )}
                  {cfg.duration_s && <Badge variant="secondary">{cfg.duration_s}s</Badge>}
                  {cfg.style && <Badge variant="outline">{cfg.style}</Badge>}
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                  <dt className="text-muted-foreground">{t("creative.generator")}</dt>
                  <dd>
                    {current.generator
                      ? t(`creative.generator.${current.generator}` as MessageKey)
                      : "—"}
                    {cfg.generator?.cost_usd != null && (
                      <span className="text-muted-foreground">
                        {" "}
                        · ${cfg.generator.cost_usd.toFixed(2)}
                      </span>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">{t("creative.commit")}</dt>
                  <dd className="flex items-center gap-1 font-mono text-xs" dir="ltr">
                    <GitCommit className="size-3.5" />
                    {commitUrl(current.repository_url, current.commit_sha) ? (
                      <a
                        href={commitUrl(current.repository_url, current.commit_sha)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {current.commit_sha?.slice(0, 10)}
                      </a>
                    ) : (
                      <span data-testid="commit-sha">{current.commit_sha?.slice(0, 10)}</span>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">{t("project.submitted")}</dt>
                  <dd>{formatRelative(current.created_at, locale)}</dd>
                </dl>
                {cfg.checks?.ok && (
                  <div className="flex items-center gap-1.5 text-success">
                    <ShieldCheck className="size-4" />
                    {t("creative.checksPassed")} ·{" "}
                    {t("creative.files", { n: cfg.files?.length ?? cfg.checks.files })}
                  </div>
                )}
                {cfg.base_version && (
                  <div className="text-muted-foreground">
                    {t("creative.basedOn", { n: cfg.base_version })}
                  </div>
                )}
                {current.revision_notes && (
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">{t("creative.notes")}</div>
                    <p
                      className="rounded-md bg-muted/50 px-3 py-2"
                      dir={textDir(current.revision_notes)}
                    >
                      {current.revision_notes}
                    </p>
                  </div>
                )}
                {(approvals.data ?? [])
                  .filter((a) => a.stage === "creative")
                  .map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center gap-2 border-t pt-2">
                      <Badge
                        variant={
                          a.decision === "approved"
                            ? "success"
                            : a.decision === "rejected"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {t(`decision.${a.decision}` as MessageKey)}
                      </Badge>
                      <span>{t("creative.version", { n: a.artifact_version })}</span>
                      {a.comment && (
                        <span className="w-full text-muted-foreground">{a.comment}</span>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <CreativePromptPanel project={project} />

      <Dialog open={dialog === "changes"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("creative.requestChanges")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="creative-comment">{t("script.comment")}</Label>
            <Textarea
              id="creative-comment"
              rows={4}
              dir="auto"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() =>
                decide.mutate({ decision: "changes_requested", comment: comment.trim() })
              }
              disabled={decide.isPending || comment.trim().length < 3}
            >
              {t("creative.requestChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "fresh"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("creative.newDirection")}</DialogTitle>
            <DialogDescription>{t("creative.newDirectionConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => decide.mutate({ decision: "rejected" })}
              disabled={decide.isPending}
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
