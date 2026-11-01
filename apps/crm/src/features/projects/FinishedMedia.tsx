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
import { useSignedUrls } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";
import type { ContentProject, ImportedMediaRow } from "@/types/db";

const mb = (bytes: number) => (bytes / 1e6).toFixed(1);

/**
 * The finished files of imported content, one group per language version (P5-T15). Stored files
 * show a thumbnail; released ones point at the live post instead. Editors can free the storage of
 * a live version and delete single files (the stored copy goes with the row).
 */
export function FinishedMedia({
  project,
  media,
  links,
}: {
  project: ContentProject;
  media: ImportedMediaRow[];
  links: [string, { url: string }][];
}) {
  const { t, dir } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
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
    mutationFn: async (language: "en" | "ar" | undefined) =>
      saveBlob(await api.downloadImported(project.id, language)),
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

  return (
    <div className="flex flex-col gap-4 border-t pt-4" data-testid="finished-media">
      <h3 className="font-medium">{t("finished.title")}</h3>
      <ImportedReview project={project} />
      {groups.map(({ lang, files }) => {
        const stored = files.filter((f) => f.storage_path);
        const url = live(lang);
        const canFree = stored.length > 0 && (!!url || (approved && downloaded(lang)));
        const caption = lang ? captions?.[lang] : captions?.default;
        return (
          <section
            key={lang ?? "all"}
            className="flex flex-col gap-2"
            data-testid={`finished-${lang ?? "all"}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {lang ? t(`imported.lang.${lang}`) : t("finished.allLanguages")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {stored.length
                  ? t("finished.stored", {
                      n: stored.length,
                      mb: mb(stored.reduce((s, f) => s + f.file_size, 0)),
                    })
                  : t("finished.allReleased")}
              </span>
              <div className="ms-auto flex flex-wrap gap-2">
                {approved && stored.length > 0 && (
                  <Button
                    size="sm"
                    variant={downloaded(lang) ? "outline" : "default"}
                    disabled={download.isPending}
                    onClick={() => download.mutate(lang ?? undefined)}
                  >
                    <Download />
                    {t("finished.download")}
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
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
              {files.map((f) => {
                const src = f.storage_path ? urls.data?.[f.storage_path] : undefined;
                return (
                  <figure key={f.id} className="group relative flex flex-col gap-1">
                    <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {src ? (
                        <button
                          type="button"
                          aria-label={t("finished.view", { file: f.file_name })}
                          className="absolute inset-0 cursor-zoom-in focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          onClick={() => setViewing({ files: stored, index: stored.indexOf(f) })}
                        >
                          {f.mime_type.startsWith("image/") ? (
                            <img
                              src={src}
                              alt={f.file_name}
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          ) : f.mime_type.startsWith("video/") ? (
                            <>
                              <video
                                src={`${src}#t=0.5`}
                                muted
                                playsInline
                                preload="metadata"
                                className="size-full object-cover"
                              />
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="rounded-full bg-black/55 p-2 text-white">
                                  <Play className="size-4 fill-current" />
                                </span>
                              </span>
                            </>
                          ) : (
                            <FileText className="mx-auto size-6 text-muted-foreground" />
                          )}
                        </button>
                      ) : !f.storage_path && f.live_url ? (
                        <a
                          href={f.live_url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="flex flex-col items-center gap-1 p-2 text-center text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="size-4" />
                          {t("finished.onSocial")}
                        </a>
                      ) : f.metadata.kept_locally ? (
                        <span className="flex flex-col items-center gap-1 p-2 text-center text-xs text-muted-foreground">
                          <HardDriveDownload className="size-4" />
                          {t("finished.keptLocally")}
                        </span>
                      ) : f.kind === "video" ? (
                        <Film className="size-6 text-muted-foreground" />
                      ) : (
                        <FileText className="size-6 text-muted-foreground" />
                      )}
                      {f.metadata.needs_native_review && (
                        <Badge variant="warning" className="absolute start-1 top-1 text-[10px]">
                          {t("finished.review")}
                        </Badge>
                      )}
                      {can("edit") && (
                        <Button
                          size="icon"
                          variant="secondary"
                          aria-label={t("finished.delete")}
                          className="absolute end-1 top-1 size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={() => setToDelete(f)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                    <figcaption className="truncate text-[11px] text-muted-foreground" dir="ltr">
                      {f.kind === "carousel_slide"
                        ? `#${f.slide_index}`
                        : t(`finished.kind.${f.kind}`)}
                      {f.duration ? ` · ${Math.round(f.duration)}s` : ""} · {mb(f.file_size)} MB
                    </figcaption>
                  </figure>
                );
              })}
            </div>
            {caption && (
              <p
                className="whitespace-pre-line rounded-md bg-muted/50 p-3 text-xs"
                dir={lang === "ar" ? "rtl" : "auto"}
              >
                {caption}
              </p>
            )}
          </section>
        );
      })}

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
    </div>
  );
}

/** A stored file at full size (image, playable video or document), with previous/next in its version. */
function MediaViewer({
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
              (file.kind === "carousel_slide"
                ? `${t("finished.kind.carousel_slide")} #${file.slide_index}`
                : t(`finished.kind.${file.kind}`))}
            {count > 1 && ` · ${t("finished.counter", { i: (viewing?.index ?? 0) + 1, n: count })}`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[70dvh] min-h-48 items-center justify-center overflow-hidden rounded-md bg-black/90">
          {!file || !src ? null : file.mime_type.startsWith("image/") ? (
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
          {src && (
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
  if (project.status === "cancelled") return null;
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
          {can("edit") && project.status === "new" && (
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
        <p className="text-xs text-muted-foreground">{t("review.approvedHint")}</p>
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
