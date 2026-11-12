import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, MessageSquareWarning, Play, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { type ClientPost, useImportedMedia, usePostComments, useSignedUrls } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import { HtmlPage, isHtml } from "@/features/projects/HtmlPage";
import { clientState, type ClientState } from "./calendar";
import { shortTitle } from "./CalendarMonth";

export const STATE_BADGE: Record<
  ClientState,
  "warning" | "success" | "destructive" | "info" | "secondary"
> = {
  waiting: "warning",
  approved: "success",
  changes: "destructive",
  scheduled: "info",
  published: "secondary",
};

/** A post for the client: its pages per language, the caption, approve / request changes, comments. */
export function ClientPostDialog({
  post,
  onClose,
}: {
  post: ClientPost | null;
  onClose: () => void;
}) {
  const { t, dir } = useI18n();
  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        closeLabel={t("common.close")}
        className="max-w-4xl gap-5 p-4 sm:p-6"
        data-testid="client-post"
      >
        {post && <PostBody key={post.id} post={post} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function PostBody({ post, onDone }: { post: ClientPost; onDone: () => void }) {
  const { t, locale, dir } = useI18n();
  const { userId } = useWorkspace();
  const qc = useQueryClient();
  const media = useImportedMedia(post.id).data ?? [];
  const comments = usePostComments(post.id);
  const [pick, setPick] = useState<string | null | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"view" | "changes">("view");
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const state = clientState(post);
  const urls = useSignedUrls(
    media.filter((m) => m.storage_path && !isHtml(m)).map((m) => m.storage_path!),
    "media",
  );

  const refresh = () => {
    for (const key of ["calendar", "post-comments"]) void qc.invalidateQueries({ queryKey: [key] });
  };
  const decide = useMutation({
    mutationFn: (input: { decision: "approved" | "changes_requested"; note?: string }) =>
      api.clientReview(post.id, input.decision, input.note),
    onSuccess: (_r, input) => {
      toast.success(
        t(input.decision === "approved" ? "client.approvedToast" : "client.changesToast"),
      );
      refresh();
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });
  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("idea_comments")
        .insert({ project_id: post.id, author_id: userId, body: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      toast.success(t("client.commentSent"));
      void qc.invalidateQueries({ queryKey: ["post-comments", post.id] });
    },
    onError: (e) => toast.error(e.message),
  });

  const groups = [...new Set(media.map((m) => m.language))].map((lang) => ({
    lang,
    files: media.filter((m) => m.language === lang && (m.storage_path || m.live_url)),
  }));
  // Open in the reader's language when the post has it.
  const group =
    groups.find((g) => g.lang === pick) ??
    (pick === undefined ? groups.find((g) => g.lang === locale) : undefined) ??
    groups[0];
  const files = group?.files ?? [];
  const i = Math.min(index, Math.max(files.length - 1, 0));
  const f = files[i];
  const lang = group?.lang ?? null;
  const caption = lang ? post.captions?.[lang] : post.captions?.default;
  const src = f?.storage_path ? urls.data?.[f.storage_path] : undefined;
  const step = (by: number) => setIndex((i + by + files.length) % files.length);
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;
  const date = post.publish_date?.slice(0, 10);

  return (
    <>
      <DialogHeader className="pe-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATE_BADGE[state]}>{t(`client.state.${state}`)}</Badge>
          {date && (
            <span className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
                dateStyle: "full",
                timeZone: "UTC",
              }).format(new Date(date))}
            </span>
          )}
        </div>
        <DialogTitle className="leading-snug" dir="auto">
          {shortTitle(post.title)}
        </DialogTitle>
        <DialogDescription>{t(`client.stateHint.${state}`)}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        {/* The post */}
        <section className="flex flex-col gap-2">
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
          <div
            className={cn(
              "relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-lg border bg-muted",
              f?.kind === "video" ? "aspect-[9/16] max-w-[22rem]" : "aspect-[4/5] max-w-[30rem]",
            )}
            style={
              f && isHtml(f) && f.width && f.height
                ? { aspectRatio: `${f.width} / ${f.height}` }
                : undefined
            }
          >
            {!f ? (
              <span className="text-sm text-muted-foreground">{t("common.loading")}</span>
            ) : isHtml(f) ? (
              <HtmlPage row={f} fill interactive />
            ) : !f.storage_path && f.live_url ? (
              <a
                href={f.live_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-sm text-primary hover:underline"
              >
                {t("finished.onSocial")}
              </a>
            ) : f.mime_type.startsWith("video/") ? (
              src ? (
                <video
                  key={src}
                  src={src}
                  controls
                  playsInline
                  className="size-full object-contain"
                />
              ) : (
                <Play className="size-6 text-muted-foreground" />
              )
            ) : src ? (
              <img src={src} alt={f.file_name} className="size-full object-contain" />
            ) : null}
            {files.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label={t("finished.prev")}
                  className="absolute start-2 top-1/2 size-9 -translate-y-1/2 rounded-full opacity-90"
                  onClick={() => step(-1)}
                >
                  <Prev className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label={t("finished.next")}
                  className="absolute end-2 top-1/2 size-9 -translate-y-1/2 rounded-full opacity-90"
                  onClick={() => step(1)}
                >
                  <Next className="size-4" />
                </Button>
              </>
            )}
          </div>
          {files.length > 1 && (
            <p className="text-center text-xs text-muted-foreground tabular-nums">
              {t("finished.counter", { i: i + 1, n: files.length })}
            </p>
          )}
          {caption && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {t("finished.caption")}
              </p>
              <p className="whitespace-pre-line" dir={lang === "ar" ? "rtl" : "auto"}>
                {caption}
              </p>
              {post.hashtags && (
                <p className="mt-2 text-xs text-muted-foreground" dir="auto">
                  {post.hashtags}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Decision and comments */}
        <aside className="flex flex-col gap-4">
          {state === "waiting" || state === "approved" ? (
            mode === "view" ? (
              <div className="flex flex-col gap-2">
                {state === "waiting" && (
                  <Button
                    className="bg-success text-white hover:bg-success/90"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ decision: "approved" })}
                  >
                    <Check />
                    {t("client.approve")}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setMode("changes")}>
                  <MessageSquareWarning />
                  {t("client.requestChanges")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-md border p-3">
                <p className="text-sm font-medium">{t("client.changesTitle")}</p>
                <Textarea
                  dir="auto"
                  rows={4}
                  autoFocus
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("client.changesPlaceholder")}
                />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setMode("view")}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    className="ms-auto"
                    disabled={note.trim().length < 3 || decide.isPending}
                    onClick={() =>
                      decide.mutate({ decision: "changes_requested", note: note.trim() })
                    }
                  >
                    <Send />
                    {t("client.sendChanges")}
                  </Button>
                </div>
              </div>
            )
          ) : null}
          {post.client_review?.status === "changes_requested" && post.client_review.note && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-destructive">{t("client.yourRequest")}</p>
              <p className="whitespace-pre-line" dir="auto">
                {post.client_review.note}
              </p>
            </div>
          )}

          <section className="flex flex-col gap-2" aria-label={t("client.comments")}>
            <h3 className="text-sm font-medium">{t("client.comments")}</h3>
            {(comments.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("client.noComments")}</p>
            ) : (
              <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                {comments.data!.map((c) => (
                  <li key={c.id} className="rounded-md bg-muted/50 p-2.5 text-sm">
                    <p className="whitespace-pre-line" dir="auto">
                      {c.body}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(c.created_at, locale)}
                    </p>
                    {c.response && (
                      <p className="mt-2 border-s-2 border-primary/40 ps-2 text-xs" dir="auto">
                        <span className="font-medium">{t("client.teamReply")}: </span>
                        {c.response}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Textarea
              dir="auto"
              rows={3}
              value={comment}
              maxLength={4000}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("client.commentPlaceholder")}
            />
            <Button
              size="sm"
              variant="secondary"
              className="self-end"
              disabled={!comment.trim() || send.isPending}
              onClick={() => send.mutate()}
            >
              <Send />
              {t("client.sendComment")}
            </Button>
          </section>
        </aside>
      </div>
    </>
  );
}
