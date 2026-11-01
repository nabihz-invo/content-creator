import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudOff, ExternalLink, FileText, Film, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { api } from "@/lib/api";
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
  const thumbs = useSignedUrls(
    media
      .filter((m) => m.storage_path && m.mime_type.startsWith("image/"))
      .map((m) => m.storage_path!),
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

  return (
    <div className="flex flex-col gap-4 border-t pt-4" data-testid="finished-media">
      <h3 className="font-medium">{t("finished.title")}</h3>
      {groups.map(({ lang, files }) => {
        const stored = files.filter((f) => f.storage_path);
        const url = live(lang);
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
              {url && stored.length > 0 && can("edit") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ms-auto"
                  disabled={release.isPending}
                  onClick={() => release.mutate(lang ?? undefined)}
                >
                  <CloudOff />
                  {t("finished.release")}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
              {files.map((f) => {
                const src = f.storage_path ? thumbs.data?.[f.storage_path] : undefined;
                return (
                  <figure key={f.id} className="group relative flex flex-col gap-1">
                    <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {src ? (
                        <img
                          src={src}
                          alt={f.file_name}
                          className="absolute inset-0 size-full object-cover"
                        />
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
