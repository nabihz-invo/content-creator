import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Download,
  Film,
  GitCommit,
  Loader2,
  Paintbrush,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  XCircle,
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
import { formatBytes, formatRelative } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import {
  type MediaAssetRow,
  type RenderJobRow,
  useApprovals,
  useRenderJobs,
  useSignedUrls,
  WORKING_STATUSES,
} from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import type { ContentProject } from "@/types/db";

type BadgeVariant = "info" | "warning" | "success" | "destructive" | "outline" | "secondary";
const RENDER_VARIANT: Record<RenderJobRow["status"], BadgeVariant> = {
  queued: "secondary",
  running: "info",
  succeeded: "success",
  failed: "destructive",
  cancelled: "outline",
  outdated: "outline",
};
const ASSET_VARIANT: Record<MediaAssetRow["status"], BadgeVariant> = {
  pending_review: "info",
  approved: "success",
  rejected: "destructive",
  outdated: "outline",
};

/** Signed one-minute link that downloads the file under a readable name. */
async function downloadAsset(a: MediaAssetRow) {
  const name = a.storage_path.split("/").pop()!;
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrl(a.storage_path, 60, { download: name });
  if (error || !data) throw error ?? new Error("download failed");
  window.location.assign(data.signedUrl);
}

export function MediaPanel({ project }: { project: ContentProject }) {
  const { t, locale } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
  const renders = useRenderJobs(project.id, WORKING_STATUSES.has(project.status));
  const approvals = useApprovals(project.id);
  const [selected, setSelected] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [dialog, setDialog] = useState<null | "render" | "creative" | "reject">(null);
  const [comment, setComment] = useState("");

  const list = renders.data ?? [];
  const current = list.find((r) => r.id === selected) ?? list[0];
  const files =
    current?.media_assets.filter(
      (a) => a.asset_type === "png" || a.asset_type === "carousel_slide",
    ) ?? [];
  const urls = useSignedUrls(
    files.map((f) => f.storage_path),
    "media",
  );
  const shown = files[Math.min(slide, Math.max(0, files.length - 1))];
  const reviewable =
    project.status === "media_in_review" &&
    current?.status === "succeeded" &&
    files.length > 0 &&
    files.every((f) => f.status === "pending_review");

  const invalidate = () => {
    for (const key of [
      "project",
      "renders",
      "approvals",
      "project-events",
      "project-jobs",
      "status-counts",
      "creatives",
      "media-library",
    ])
      void qc.invalidateQueries({ queryKey: [key] });
  };
  const decide = useMutation({
    mutationFn: (input: {
      decision: "approved" | "changes_requested" | "rejected";
      comment?: string;
      return_to?: "render" | "creative";
    }) =>
      api.decide({
        artifact_type: "media_manifest",
        artifact_id: current!.id,
        artifact_version: current!.version,
        artifact_hash: current!.manifest_hash!,
        ...input,
      }),
    onSuccess: (_r, input) => {
      toast.success(
        t(
          input.decision === "approved"
            ? "media.approvedToast"
            : input.decision === "rejected"
              ? "media.rejectToast"
              : input.return_to === "creative"
                ? "media.backToast"
                : "media.rerenderToast",
        ),
      );
      setDialog(null);
      setComment("");
      setSelected(null);
      setSlide(0);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const renderAgain = useMutation({
    mutationFn: () => api.requestRender(current!.creative_version_id, crypto.randomUUID()),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e.message),
  });

  if (!current) return <p className="text-sm text-muted-foreground">{t("media.empty")}</p>;

  const active = current.status === "queued" || current.status === "running";
  const renderApprovals = (approvals.data ?? []).filter((a) => a.stage === "media");

  return (
    <div className="flex flex-col gap-4" data-testid="media-panel">
      {active && current.output_type === "mp4" && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 text-sm">
            <Film className="mt-0.5 size-5 shrink-0 text-warning" />
            {t("media.videoLater")}
          </CardContent>
        </Card>
      )}
      {active && current.output_type !== "mp4" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3">
            <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
            <div className="flex-1">
              <div className="font-medium">
                {current.status === "queued"
                  ? t("media.queued")
                  : t("media.rendering", { progress: current.progress })}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t("media.renderingBody")}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.max(4, current.progress)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {(current.status === "failed" || current.status === "cancelled") && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-wrap items-start gap-3 text-sm">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {t(current.status === "failed" ? "media.failed" : "media.cancelled")}
              </div>
              {current.error_details?.message && (
                <p className="mt-1 break-words text-muted-foreground" dir="ltr">
                  {current.error_details.message}
                </p>
              )}
            </div>
            {can("edit") && project.status === "rendering" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => renderAgain.mutate()}
                disabled={renderAgain.isPending}
              >
                <RefreshCw />
                {t("media.renderAgain")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {list.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              setSelected(r.id);
              setSlide(0);
            }}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition hover:border-primary/40",
              r.id === current.id && "border-primary bg-primary/5",
            )}
          >
            {t("media.render", { n: r.version })}
            <Badge variant={RENDER_VARIANT[r.status]}>
              {t(`media.status.${r.status}` as MessageKey)}
            </Badge>
          </button>
        ))}
      </div>

      {files.length > 0 && shown && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{t("media.title")}</CardTitle>
                <CardDescription>{t("media.subtitle")}</CardDescription>
              </div>
              {reviewable && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDialog("reject")}>
                    <XCircle />
                    {t("media.reject")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDialog("creative")}>
                    <Paintbrush />
                    {t("media.backToCreative")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDialog("render")}>
                    <RefreshCw />
                    {t("media.rerender")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => decide.mutate({ decision: "approved" })}
                    disabled={decide.isPending}
                  >
                    {decide.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    {t("media.approve")}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {files.length > 1 && (
                <div className="flex flex-wrap gap-1.5" dir="ltr">
                  {files.map((f, i) => (
                    <Button
                      key={f.id}
                      size="sm"
                      variant={i === slide ? "default" : "outline"}
                      onClick={() => setSlide(i)}
                    >
                      {t("media.slide", { n: f.slide_index ?? i + 1 })}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex justify-center rounded-lg border bg-muted/40 p-3">
                {urls.data?.[shown.storage_path] ? (
                  <img
                    src={urls.data[shown.storage_path]}
                    alt={shown.storage_path.split("/").pop()}
                    data-testid="media-image"
                    className="max-h-[36rem] w-auto max-w-full rounded shadow-sm"
                    style={{ aspectRatio: `${shown.width} / ${shown.height}` }}
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {files.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1" dir="ltr">
                  {files.map((f, i) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSlide(i)}
                      aria-label={t("media.slide", { n: f.slide_index ?? i + 1 })}
                      className={cn(
                        "shrink-0 overflow-hidden rounded-md border-2 transition",
                        i === slide
                          ? "border-primary"
                          : "border-transparent hover:border-primary/40",
                      )}
                    >
                      {urls.data?.[f.storage_path] ? (
                        <img
                          src={urls.data[f.storage_path]}
                          alt=""
                          className="h-24 w-auto"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-24 w-20 animate-pulse bg-muted" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("media.file")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant={ASSET_VARIANT[shown.status]}>
                  {t(`media.asset.${shown.status}` as MessageKey)}
                </Badge>
                <Badge variant="secondary" dir="ltr">
                  {current.output_type.toUpperCase()}
                </Badge>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                <dt className="text-muted-foreground">{t("media.dimensions")}</dt>
                <dd dir="ltr" className="text-start" data-testid="media-dimensions">
                  {shown.width}×{shown.height}
                </dd>
                <dt className="text-muted-foreground">{t("media.bytes")}</dt>
                <dd>{formatBytes(shown.file_size)}</dd>
                <dt className="text-muted-foreground">{t("media.checksum")}</dt>
                <dd className="truncate font-mono text-xs" dir="ltr" title={shown.checksum}>
                  {shown.checksum.slice(0, 16)}…
                </dd>
                <dt className="text-muted-foreground">{t("project.submitted")}</dt>
                <dd>{formatRelative(current.completed_at ?? current.created_at, locale)}</dd>
              </dl>
              <div className="flex items-start gap-1.5 text-success">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <span>{t("media.validated")}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground" dir="auto">
                <GitCommit className="size-3.5" />
                {t("media.fromCreative", {
                  n: current.configuration.creative_version ?? "?",
                  sha: (current.configuration.commit_sha ?? "").slice(0, 10),
                })}
              </div>
              {current.manifest_hash && (
                <div className="text-xs text-muted-foreground">
                  {t("media.manifest")}{" "}
                  <span className="font-mono" dir="ltr" data-testid="manifest-hash">
                    {current.manifest_hash.slice(0, 16)}…
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadAsset(shown).catch((e) => toast.error(String(e)))}
              >
                <Download />
                {t("media.download")}
              </Button>
              {renderApprovals.length > 0 && (
                <div className="border-t pt-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    {t("media.decisions")}
                  </div>
                  <ul className="flex flex-col gap-2">
                    {renderApprovals.map((a) => (
                      <li key={a.id} className="text-xs">
                        <span className="font-medium">
                          {t("media.render", { n: a.artifact_version })}
                        </span>{" "}
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
                        {a.comment && (
                          <p className="mt-1 text-muted-foreground" dir="auto">
                            {a.comment}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={dialog === "render" || dialog === "creative"}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>
              {t(dialog === "creative" ? "media.backTitle" : "media.rerenderTitle")}
            </DialogTitle>
            {dialog === "creative" && <DialogDescription>{t("media.backBody")}</DialogDescription>}
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="media-comment">{t("media.whatsWrong")}</Label>
            <Textarea
              id="media-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              dir="auto"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() =>
                decide.mutate({
                  decision: "changes_requested",
                  comment: comment.trim(),
                  return_to: dialog === "creative" ? "creative" : "render",
                })
              }
              disabled={decide.isPending || comment.trim().length < 3}
            >
              {t(dialog === "creative" ? "media.backToCreative" : "media.rerender")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "reject"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("media.rejectTitle")}</DialogTitle>
            <DialogDescription>{t("media.rejectBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => decide.mutate({ decision: "rejected" })}
              disabled={decide.isPending}
            >
              {t("media.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
