import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Download,
  ExternalLink,
  FileText,
  Film,
  HardDriveDownload,
  MessageSquareWarning,
  Play,
  Trash2,
} from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api, saveBlob } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useImportedMedia, useSignedUrls } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import type { ContentProject, ImportedMediaRow } from "@/types/db";
import { HtmlPage, isHtml } from "./HtmlPage";
import { liveLinks } from "./ImportedContentCard";

const mb = (bytes: number) => (bytes / 1e6).toFixed(1);

/**
 * The finished files of imported content as a card (P5-T15/T17/T18): the review, then one language
 * version at a time as a slider (click to open full size). Released files point at the live post.
 * Editors free a version's storage once it is live (or approved and downloaded) and delete files.
 */
export function FinishedMedia({ project }: { project: ContentProject }) {
  const { t, dir } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
  const imported = project.source_metadata.origin === "content_plan_import";
  const media = useImportedMedia(imported ? project.id : undefined).data ?? [];
  const links = liveLinks(project);
  // undefined = the first language version
  const [pick, setPick] = useState<string | null | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [toDelete, setToDelete] = useState<ImportedMediaRow | null>(null);
  // The files open in the viewer: the stored files of one language version.
  const [viewing, setViewing] = useState<{ files: ImportedMediaRow[]; index: number } | null>(null);
  const urls = useSignedUrls(
    media.filter((m) => m.storage_path).map((m) => m.storage_path!),
    "media",
  );
  const refresh = () => {
    for (const key of ["imported-media", "project-events"])
      void qc.invalidateQueries({ queryKey: [key] });
  };
  const release = useMutation({
    mutationFn: (language: "en" | "ar" | undefined) =>
      api.releaseImportedMedia(project.id, language),
    onSuccess: (r) => {
      toast.success(t("finished.released", { n: r.released, mb: mb(r.bytes) }));
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const download = useMutation({
    mutationFn: async () => saveBlob(await api.downloadImported(project.id)),
    onSuccess: () => {
      for (const key of ["project", "project-events"])
        void qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteImportedMedia(id),
    onSuccess: () => {
      toast.success(t("finished.deleted"));
      setToDelete(null);
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  if (!media.length) return null;

  const live = (lang: string | null) =>
    links.find(([l]) => l === lang)?.[1].url ?? links.find(([l]) => l === "both")?.[1].url ?? null;
  const groups = [...new Set(media.map((m) => m.language))].map((lang) => ({
    lang,
    files: media.filter((m) => m.language === lang),
  }));
  const captions = project.source_metadata.finished?.captions;
  const review = project.source_metadata.review;
  const approved = review?.status === "approved";
  const downloaded = (lang: "en" | "ar" | null) =>
    !!review?.downloaded?.all || (lang ? !!review?.downloaded?.[lang] : !!review?.downloaded?.en);

  const group = groups.find((g) => g.lang === pick) ?? groups[0]!;
  const lang = group.lang;
  const files = group.files;
  const i = Math.min(index, files.length - 1);
  const f = files[i]!;
  const stored = files.filter((x) => x.storage_path);
  // The download is one zip of every language, so it stays available on a tab already freed.
  // HTML posts (P5-T25) are rendered locally from the approved pages: nothing to download or free.
  const htmlPost = media.some(isHtml);
  const canDownload = approved && !htmlPost && media.some((m) => m.storage_path);
  const src = f.storage_path ? urls.data?.[f.storage_path] : undefined;
  const url = live(lang);
  const canFree = !htmlPost && stored.length > 0 && (!!url || (approved && downloaded(lang)));
  const caption = lang ? captions?.[lang] : captions?.default;
  const step = (by: number) => setIndex((i + by + files.length) % files.length);
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <Card data-testid="finished-media">
      <CardHeader>
        <CardTitle className="text-base">{t("finished.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ImportedReview project={project} />
        {groups.length > 1 && (
          <div className="flex gap-1" role="tablist">
            {groups.map((g) => (
              <Button
                key={g.lang ?? "all"}
                size="sm"
                role="tab"
                aria-selected={g.lang === lang}
                variant={g.lang === lang ? "secondary" : "ghost"}
                onClick={() => {
                  setPick(g.lang);
                  setIndex(0);
                }}
              >
                {g.lang ? t(`imported.lang.${g.lang}`) : t("finished.allLanguages")}
              </Button>
            ))}
          </div>
        )}
        <section className="flex flex-col gap-2" data-testid={`finished-${lang ?? "all"}`}>
          <div
            className={cn(
              "group relative mx-auto flex max-h-[28rem] w-full items-center justify-center overflow-hidden rounded-lg border bg-muted",
              f.kind === "video" ? "aspect-[9/16] max-w-[15.75rem]" : "aspect-[4/5]",
            )}
            style={
              isHtml(f) && f.width && f.height
                ? {
                    aspectRatio: `${f.width} / ${f.height}`,
                    maxWidth: `${(28 * 16 * f.width) / f.height}px`,
                  }
                : undefined
            }
          >
            {src || (isHtml(f) && f.storage_path) ? (
              <button
                type="button"
                aria-label={t("finished.view", { file: f.file_name })}
                className="absolute inset-0 cursor-zoom-in focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => setViewing({ files: stored, index: Math.max(0, stored.indexOf(f)) })}
              >
                {isHtml(f) ? (
                  <HtmlPage row={f} fill />
                ) : f.mime_type.startsWith("image/") ? (
                  <img src={src} alt={f.file_name} className="size-full object-cover" />
                ) : f.mime_type.startsWith("video/") ? (
                  <>
                    <video
                      key={src}
                      src={`${src}#t=0.5`}
                      muted
                      playsInline
                      preload="metadata"
                      className="size-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/55 p-3 text-white">
                        <Play className="size-5 fill-current" />
                      </span>
                    </span>
                  </>
                ) : (
                  <FileText className="mx-auto size-8 text-muted-foreground" />
                )}
              </button>
            ) : !f.storage_path && f.live_url ? (
              <a
                href={f.live_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex flex-col items-center gap-1 p-2 text-center text-sm text-primary hover:underline"
              >
                <ExternalLink className="size-5" />
                {t("finished.onSocial")}
              </a>
            ) : f.metadata.kept_locally ? (
              <span className="flex flex-col items-center gap-1 p-2 text-center text-sm text-muted-foreground">
                <HardDriveDownload className="size-5" />
                {t("finished.keptLocally")}
              </span>
            ) : f.kind === "video" ? (
              <Film className="size-8 text-muted-foreground" />
            ) : (
              <FileText className="size-8 text-muted-foreground" />
            )}
            {f.metadata.needs_native_review && (
              <Badge variant="warning" className="absolute start-2 top-2 text-[10px]">
                {t("finished.review")}
              </Badge>
            )}
            {can("edit") && (
              <Button
                size="icon"
                variant="secondary"
                aria-label={t("finished.delete")}
                className="absolute end-2 top-2 size-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => setToDelete(f)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
            {files.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label={t("finished.prev")}
                  className="absolute start-2 top-1/2 size-8 -translate-y-1/2 rounded-full opacity-90"
                  onClick={() => step(-1)}
                >
                  <Prev className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label={t("finished.next")}
                  className="absolute end-2 top-1/2 size-8 -translate-y-1/2 rounded-full opacity-90"
                  onClick={() => step(1)}
                >
                  <Next className="size-4" />
                </Button>
              </>
            )}
          </div>
          <div
            className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
            dir="ltr"
          >
            <span className="truncate">
              {f.kind === "carousel_slide" || (f.kind === "html" && files.length > 1)
                ? `#${f.slide_index}`
                : t(`finished.kind.${f.kind}`)}
              {f.duration ? ` · ${Math.round(f.duration)}s` : ""} · {mb(f.file_size)} MB
            </span>
            {files.length > 1 && (
              <span className="tabular-nums">
                {t("finished.counter", { i: i + 1, n: files.length })}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {stored.length
              ? t("finished.stored", {
                  n: stored.length,
                  mb: mb(stored.reduce((s, x) => s + x.file_size, 0)),
                })
              : t("finished.allReleased")}
          </p>
          {canDownload || (canFree && can("edit")) ? (
            <div className="flex flex-wrap gap-2">
              {canDownload && (
                <Button
                  size="sm"
                  variant={review?.downloaded?.all ? "outline" : "default"}
                  disabled={download.isPending}
                  onClick={() => download.mutate()}
                >
                  <Download />
                  {t(groups.length > 1 ? "finished.downloadAll" : "finished.download")}
                </Button>
              )}
              {canFree && can("edit") && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={release.isPending}
                  onClick={() => release.mutate(lang ?? undefined)}
                >
                  <CloudOff />
                  {t("finished.release")}
                </Button>
              )}
            </div>
          ) : null}
          {caption && (
            <details className="rounded-md bg-muted/50 p-3 text-xs">
              <summary className="cursor-pointer font-medium">{t("finished.caption")}</summary>
              <p className="mt-2 whitespace-pre-line" dir={lang === "ar" ? "rtl" : "auto"}>
                {caption}
              </p>
            </details>
          )}
        </section>
      </CardContent>

      <MediaViewer
        viewing={viewing}
        urls={urls.data ?? {}}
        onIndex={(index) => setViewing((v) => v && { ...v, index })}
        onClose={() => setViewing(null)}
      />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent dir={dir} closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("finished.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("finished.deleteBody", { file: toDelete?.file_name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => toDelete && remove.mutate(toDelete.id)}
            >
              <Trash2 />
              {t("finished.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** A stored file at full size (image, playable video or document), with previous/next in its version. */
export function MediaViewer({
  viewing,
  urls,
  onIndex,
  onClose,
}: {
  viewing: { files: ImportedMediaRow[]; index: number } | null;
  urls: Record<string, string>;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const { t, dir } = useI18n();
  const file = viewing?.files[viewing.index];
  const src = file?.storage_path ? urls[file.storage_path] : undefined;
  const html = !!file && isHtml(file);
  const count = viewing?.files.length ?? 0;
  const step = (by: number) => viewing && onIndex((viewing.index + by + count) % count);
  // Arrow keys follow the reading direction: in Arabic, left is "next".
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    step((e.key === "ArrowRight") === (dir === "ltr") ? 1 : -1);
  };
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        closeLabel={t("common.close")}
        className="max-w-4xl gap-3 p-4"
        onKeyDown={onKeyDown}
        data-testid="media-viewer"
      >
        <DialogHeader className="pe-8">
          <DialogTitle className="truncate text-sm" dir="ltr">
            {file?.file_name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {file &&
              (file.kind === "carousel_slide" || (file.kind === "html" && count > 1)
                ? `${t(`finished.kind.${file.kind}`)} #${file.slide_index}`
                : t(`finished.kind.${file.kind}`))}
            {count > 1 && ` · ${t("finished.counter", { i: (viewing?.index ?? 0) + 1, n: count })}`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[70dvh] min-h-48 items-center justify-center overflow-hidden rounded-md bg-black/90">
          {file && html && file.storage_path ? (
            <div className="h-[70dvh] w-full p-2">
              <HtmlPage key={file.id} row={file} fill interactive />
            </div>
          ) : !file || !src ? null : file.mime_type.startsWith("image/") ? (
            <img src={src} alt={file.file_name} className="max-h-[70dvh] w-auto object-contain" />
          ) : file.mime_type.startsWith("video/") ? (
            <video
              key={src}
              src={src}
              controls
              autoPlay
              playsInline
              className="max-h-[70dvh] w-auto"
            />
          ) : (
            <iframe src={src} title={file.file_name} className="h-[70dvh] w-full bg-white" />
          )}
        </div>
        <DialogFooter className="items-center sm:justify-between">
          <div className="flex gap-2">
            {count > 1 && (
              <>
                <Button size="sm" variant="outline" onClick={() => step(-1)}>
                  <Prev />
                  {t("finished.prev")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => step(1)}>
                  {t("finished.next")}
                  <Next />
                </Button>
              </>
            )}
          </div>
          {src && !html && (
            <Button size="sm" variant="ghost" asChild>
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                {t("finished.openNew")}
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Review of an imported post (P5-T17): approve (then download and free storage), request changes
 * with a note (fixed files are re-uploaded and the post comes back for review), or discard it with
 * every file and its storage.
 */
function ImportedReview({ project }: { project: ContentProject }) {
  const { t, dir, locale } = useI18n();
  const { can, role } = useWorkspace();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<"changes" | "discard" | null>(null);
  const [text, setText] = useState("");
  const review = project.source_metadata.review;
  const done = () => {
    setDialog(null);
    setText("");
    for (const key of ["project", "project-events", "imported-media", "projects", "status-counts"])
      void qc.invalidateQueries({ queryKey: [key] });
  };
  const decide = useMutation({
    mutationFn: (input: { decision: "approved" | "changes_requested"; note?: string }) =>
      api.reviewImported(project.id, input.decision, input.note),
    onSuccess: (_r, input) => {
      toast.success(
        t(input.decision === "approved" ? "review.approvedToast" : "review.changesToast"),
      );
      done();
    },
    onError: (e) => toast.error(e.message),
  });
  const discard = useMutation({
    mutationFn: () => api.discardImported(project.id, text.trim()),
    onSuccess: (r) => {
      toast.success(t("review.discardedToast", { n: r.files, mb: mb(r.bytes) }));
      done();
    },
    onError: (e) => toast.error(e.message),
  });
  if (project.status !== "new" && project.status !== "ready_to_publish") return null;
  const canReview = role === "admin" || role === "editor" || role === "reviewer";

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3" data-testid="imported-review">
      <div className="flex flex-wrap items-center gap-2">
        {review?.status === "approved" ? (
          <Badge variant="success">{t("review.approved")}</Badge>
        ) : review?.status === "changes_requested" ? (
          <Badge variant="warning">{t("review.changesRequested")}</Badge>
        ) : (
          <Badge variant="outline">{t("review.waiting")}</Badge>
        )}
        {review && (
          <span className="text-xs text-muted-foreground">
            {new Date(review.at).toLocaleDateString(locale)}
          </span>
        )}
        <div className="ms-auto flex flex-wrap gap-2">
          {canReview && review?.status !== "approved" && (
            <Button
              size="sm"
              onClick={() => decide.mutate({ decision: "approved" })}
              disabled={decide.isPending}
            >
              <Check />
              {t("review.approve")}
            </Button>
          )}
          {canReview && (
            <Button size="sm" variant="outline" onClick={() => setDialog("changes")}>
              <MessageSquareWarning />
              {t("review.requestChanges")}
            </Button>
          )}
          {can("edit") && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => setDialog("discard")}
            >
              <Trash2 />
              {t("review.discard")}
            </Button>
          )}
        </div>
      </div>
      {review?.status === "changes_requested" && review.note && (
        <p className="whitespace-pre-line text-xs" dir="auto">
          {review.note}
        </p>
      )}
      {review?.status === "approved" && (
        <p className="text-xs text-muted-foreground">
          {t(
            project.source_metadata.finished?.format === "html"
              ? "review.approvedHtmlHint"
              : "review.approvedHint",
          )}
        </p>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent dir={dir} closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>
              {t(dialog === "discard" ? "review.discardTitle" : "review.changesTitle")}
            </DialogTitle>
            <DialogDescription>
              {t(dialog === "discard" ? "review.discardBody" : "review.changesBody")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            dir="auto"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(
              dialog === "discard" ? "review.reasonPlaceholder" : "review.notePlaceholder",
            )}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("common.cancel")}
            </Button>
            {dialog === "discard" ? (
              <Button
                variant="destructive"
                disabled={text.trim().length < 3 || discard.isPending}
                onClick={() => discard.mutate()}
              >
                <Trash2 />
                {t("review.discard")}
              </Button>
            ) : (
              <Button
                disabled={text.trim().length < 3 || decide.isPending}
                onClick={() => decide.mutate({ decision: "changes_requested", note: text.trim() })}
              >
                <MessageSquareWarning />
                {t("review.requestChanges")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
