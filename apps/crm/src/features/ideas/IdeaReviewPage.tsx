import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Lightbulb,
  MessageSquarePlus,
  Play,
  Send,
  X,
} from "lucide-react";
import {
  type ComponentType,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/States";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatDateTime, formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { type PendingIdea, useIdeaComments, usePendingIdeas, useSignedUrls } from "@/lib/queries";
import { MediaViewer } from "@/features/projects/FinishedMedia";
import { HtmlPage } from "@/features/projects/HtmlPage";
import type { ImportedMediaRow } from "@/types/db";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";

/** An imported post that is already made (files to look at) rather than an idea to produce. */
const isPost = (i: PendingIdea) => i.imported_media.length > 0 || !!i.finished;
const DEFAULT_REASON = "Declined in idea review";

type Dialogs =
  | { kind: "details"; idea: PendingIdea }
  | { kind: "comment"; idea: PendingIdea }
  | { kind: "decline"; idea: PendingIdea }
  | null;

/**
 * Idea review (P5-T20): every item waiting for the owner as a card in a slider (see needsReview).
 * For an idea, approve starts the pipeline and decline cancels it; for a finished imported post, approve marks it ready to publish
 * and decline deletes it with its files. Details shows everything (and the files), and comments are
 * notes the agent reads in its next session (it revises the idea or the post and answers here).
 */
export function IdeaReviewPage() {
  const { t } = useI18n();
  const { workspaceId, can } = useWorkspace();
  const qc = useQueryClient();
  const ideas = usePendingIdeas(workspaceId);
  // Cards leave the slider right away; the list is refreshed behind them.
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const list = (ideas.data ?? []).filter((i) => !gone.has(i.id));
  const editor = can("edit");

  const refresh = useCallback(() => {
    for (const key of ["pending-ideas", "projects", "status-counts", "project"])
      void qc.invalidateQueries({ queryKey: [key] });
  }, [qc]);

  const remove = (id: string) => setGone((s) => new Set(s).add(id));
  const restore = (id: string) =>
    setGone((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });

  const approve = useMutation({
    mutationFn: (idea: PendingIdea): Promise<unknown> =>
      isPost(idea) ? api.reviewImported(idea.id, "approved") : api.analyze(idea.id),
    onMutate: (idea) => remove(idea.id),
    onSuccess: (_r, idea) => {
      toast.success(
        t(isPost(idea) ? "ideas.postApproved" : "ideas.approved", { title: idea.title }),
      );
      refresh();
    },
    onError: (e, idea) => {
      restore(idea.id);
      toast.error(e.message);
    },
  });

  const decline = useMutation({
    mutationFn: ({ idea, reason }: { idea: PendingIdea; reason: string }): Promise<unknown> =>
      isPost(idea)
        ? api.discardImported(idea.id, reason.trim().length >= 3 ? reason.trim() : DEFAULT_REASON)
        : api.declineIdea(idea.id, reason),
    onMutate: ({ idea }) => {
      remove(idea.id);
      setDialog(null);
    },
    onSuccess: (_r, { idea }) => {
      toast.success(t("ideas.declined", { title: idea.title }));
      refresh();
    },
    onError: (e, { idea }) => {
      restore(idea.id);
      toast.error(e.message);
    },
  });

  // Which card is in the middle of the slider.
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
    let best = 0;
    let dist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setActive(best);
  };

  const goTo = (i: number) => {
    const el = track.current?.children[Math.max(0, Math.min(i, list.length - 1))];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  // Keep the counter right when cards leave the slider.
  useEffect(() => {
    if (active > list.length - 1) setActive(Math.max(0, list.length - 1));
  }, [active, list.length]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const forward = (e.key === "ArrowRight") !== rtl;
      goTo(active + (forward ? 1 : -1));
    }
  };

  const total = list.length;

  return (
    <>
      <PageHeader
        title={t("nav.ideas")}
        subtitle={t("ideas.subtitle")}
        actions={
          total > 0 ? (
            <Badge variant="info" className="text-sm" aria-live="polite">
              {t("ideas.count", { n: active + 1, total })}
            </Badge>
          ) : undefined
        }
      />

      {ideas.isLoading ? (
        <ListSkeleton rows={3} />
      ) : ideas.isError ? (
        <ErrorState error={ideas.error} onRetry={() => void ideas.refetch()} />
      ) : total === 0 ? (
        <EmptyState icon={<Lightbulb className="size-5" />} message={t("ideas.empty")} />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Progress through the list */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${((active + 1) / total) * 100}%` }}
            />
          </div>

          <div className="relative">
            <div
              ref={track}
              onScroll={onScroll}
              onKeyDown={onKey}
              tabIndex={0}
              role="region"
              aria-roledescription="carousel"
              aria-label={t("nav.ideas")}
              data-testid="idea-slider"
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[7.5%] pb-4 focus-visible:outline-none sm:px-[calc(50%-11rem)] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {list.map((idea, i) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  focused={i === active}
                  near={Math.abs(i - active) <= 2}
                  editor={editor}
                  busy={approve.isPending && approve.variables?.id === idea.id}
                  onFocus={() => i !== active && goTo(i)}
                  onApprove={() => approve.mutate(idea)}
                  onDecline={() => setDialog({ kind: "decline", idea })}
                  onDetails={() => setDialog({ kind: "details", idea })}
                  onComment={() => setDialog({ kind: "comment", idea })}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 start-1 hidden -translate-y-1/2 rounded-full shadow-md sm:inline-flex"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label={t("ideas.previous")}
            >
              <ChevronLeft className="rtl:-scale-x-100" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 end-1 hidden -translate-y-1/2 rounded-full shadow-md sm:inline-flex"
              onClick={() => goTo(active + 1)}
              disabled={active >= total - 1}
              aria-label={t("ideas.next")}
            >
              <ChevronRight className="rtl:-scale-x-100" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">{t("ideas.hint")}</p>
        </div>
      )}

      {dialog?.kind === "details" && (
        <DetailsDialog
          idea={dialog.idea}
          editor={editor}
          onClose={() => setDialog(null)}
          onApprove={() => {
            setDialog(null);
            approve.mutate(dialog.idea);
          }}
          onDecline={() => setDialog({ kind: "decline", idea: dialog.idea })}
          onComment={() => setDialog({ kind: "comment", idea: dialog.idea })}
        />
      )}
      {dialog?.kind === "comment" && (
        <CommentDialog
          idea={dialog.idea}
          onClose={() => setDialog(null)}
          onSent={() => {
            // Out of the cached list, not `gone`: it has to come back once the agent has answered.
            qc.setQueryData<PendingIdea[]>(["pending-ideas", workspaceId], (rows) =>
              rows?.filter((i) => i.id !== dialog.idea.id),
            );
            setDialog(null);
            refresh();
          }}
        />
      )}
      {dialog?.kind === "decline" && (
        <DeclineDialog
          idea={dialog.idea}
          pending={decline.isPending}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => decline.mutate({ idea: dialog.idea, reason })}
        />
      )}
    </>
  );
}

function IdeaBadges({ idea }: { idea: PendingIdea }) {
  const { t } = useI18n();
  const answered = idea.idea_comments.filter((c) => c.status === "addressed").length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {idea.plan_id && (
        <Badge variant="info" dir="ltr">
          {idea.plan_id}
        </Badge>
      )}
      {idea.format && <Badge variant="secondary">{idea.format}</Badge>}
      {!idea.format && idea.content_type && (
        <Badge variant="secondary">{t(`contentType.${idea.content_type}`)}</Badge>
      )}
      {idea.publish_date && (
        <Badge variant="outline">
          {t("imported.planned", { date: idea.publish_date.slice(0, 10) })}
        </Badge>
      )}
      {isPost(idea) && <Badge variant="success">{t("ideas.post")}</Badge>}
      {idea.sheet === "Backlog" && <Badge variant="outline">{t("ideas.backlog")}</Badge>}
      {answered > 0 && <Badge variant="success">{t("ideas.answeredNotes", { n: answered })}</Badge>}
    </div>
  );
}

function IdeaCard({
  idea,
  focused,
  near,
  editor,
  busy,
  onFocus,
  onApprove,
  onDecline,
  onDetails,
  onComment,
}: {
  idea: PendingIdea;
  focused: boolean;
  near: boolean;
  editor: boolean;
  busy: boolean;
  onFocus: () => void;
  onApprove: () => void;
  onDecline: () => void;
  onDetails: () => void;
  onComment: () => void;
}) {
  const { t } = useI18n();
  return (
    <article
      onClick={onFocus}
      data-testid="idea-card"
      className={cn(
        "flex h-[34rem] w-[85%] shrink-0 snap-center flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 sm:w-[22rem]",
        focused ? "scale-100 opacity-100 shadow-md" : "scale-[0.96] opacity-60",
      )}
    >
      <IdeaBadges idea={idea} />
      <h2
        className="mt-3 line-clamp-2 text-lg leading-snug font-semibold"
        dir={textDir(idea.title)}
      >
        {idea.title}
      </h2>
      {isPost(idea) && <MediaPreview idea={idea} load={near} className="mt-3 h-48" />}
      <p
        className="mt-2 line-clamp-[11] min-h-0 flex-1 overflow-hidden text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground"
        dir={textDir(idea.original_idea)}
      >
        {idea.original_idea}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2 border-t pt-4">
        <Action
          icon={Check}
          label={t("ideas.approve")}
          tone="bg-success text-white hover:bg-success/90"
          onClick={onApprove}
          disabled={!editor || busy}
          title={
            editor
              ? t(isPost(idea) ? "ideas.postApproveHint" : "ideas.approveHint")
              : t("common.readOnly")
          }
        />
        <Action
          icon={X}
          label={t("ideas.decline")}
          tone="bg-destructive text-white hover:bg-destructive/90"
          onClick={onDecline}
          disabled={!editor}
          title={
            editor
              ? t(isPost(idea) ? "ideas.postDeclineHint" : "ideas.declineHint")
              : t("common.readOnly")
          }
        />
        <Action
          icon={Info}
          label={t("ideas.details")}
          tone="border bg-card text-foreground hover:bg-accent"
          onClick={onDetails}
          title={t("ideas.detailsHint")}
        />
        <Action
          icon={MessageSquarePlus}
          label={t("ideas.comment")}
          tone="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onComment}
          title={t("ideas.commentHint")}
        />
      </div>
    </article>
  );
}

function Action({
  icon: Icon,
  label,
  tone,
  onClick,
  disabled,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: string;
  onClick: () => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      aria-label={label}
      className="group flex flex-col items-center gap-1.5 rounded-lg py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-105 group-active:scale-95",
          tone,
        )}
      >
        <Icon className="size-5" />
      </span>
      {label}
    </button>
  );
}

function CommentThread({ projectId }: { projectId: string }) {
  const { t, locale } = useI18n();
  const { userId } = useWorkspace();
  const comments = useIdeaComments(projectId);
  if (comments.isLoading) return <ListSkeleton rows={2} />;
  const rows = comments.data ?? [];
  if (!rows.length) return <p className="text-sm text-muted-foreground">{t("ideas.noNotes")}</p>;
  return (
    <ol className="flex flex-col gap-3" data-testid="idea-comments">
      {rows.map((c) => (
        <li key={c.id} className="rounded-lg border p-3 text-sm">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {c.author_id === userId ? t("ideas.you") : t("ideas.teamMember")}
            </span>
            <span title={formatDateTime(c.created_at, locale)}>
              {formatRelative(c.created_at, locale)}
            </span>
          </div>
          <p className="whitespace-pre-wrap" dir={textDir(c.body)}>
            {c.body}
          </p>
          {c.status === "open" ? (
            <Badge variant="warning" className="mt-2">
              {t("ideas.waiting")}
            </Badge>
          ) : (
            <div className="mt-2 rounded-md bg-success/10 p-2.5">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-success">
                <Bot className="size-3.5" />
                {t("ideas.agentAnswer")}
                {c.addressed_at && (
                  <span className="font-normal text-muted-foreground">
                    · {formatRelative(c.addressed_at, locale)}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap" dir={textDir(c.response)}>
                {c.response}
              </p>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function DetailsDialog({
  idea,
  editor,
  onClose,
  onApprove,
  onDecline,
  onComment,
}: {
  idea: PendingIdea;
  editor: boolean;
  onClose: () => void;
  onApprove: () => void;
  onDecline: () => void;
  onComment: () => void;
}) {
  const { t, locale } = useI18n();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle dir={textDir(idea.title)}>{idea.title}</DialogTitle>
          <DialogDescription>
            {t("ideas.submitted", { when: formatDateTime(idea.submitted_at, locale) })}
            {idea.brands?.name ? ` · ${idea.brands.name}` : ""}
            {idea.pillar ? ` · ${idea.pillar}` : ""}
          </DialogDescription>
        </DialogHeader>
        <IdeaBadges idea={idea} />
        {isPost(idea) && <MediaPreview idea={idea} load className="h-72" />}
        {idea.project_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {idea.project_tags.map(({ tags }) => (
              <Badge key={tags.id} variant="outline" className="font-normal">
                #{tags.name}
              </Badge>
            ))}
          </div>
        )}
        <p
          className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap"
          dir={textDir(idea.original_idea)}
        >
          {idea.original_idea}
        </p>
        {idea.source_url && (
          <a
            href={idea.source_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            dir="ltr"
          >
            {idea.source_url}
            <ExternalLink className="size-3.5" />
          </a>
        )}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t("ideas.notes")}</h3>
          <CommentThread projectId={idea.id} />
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" asChild>
            <Link to={`/projects/${idea.id}`}>
              {t("ideas.openPage")}
              <ExternalLink />
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onComment}>
              <MessageSquarePlus />
              {t("ideas.comment")}
            </Button>
            {editor && (
              <>
                <Button variant="destructive" onClick={onDecline}>
                  <X />
                  {t("ideas.decline")}
                </Button>
                <Button className="bg-success text-white hover:bg-success/90" onClick={onApprove}>
                  <Check />
                  {t("ideas.approve")}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CommentDialog({
  idea,
  onClose,
  onSent,
}: {
  idea: PendingIdea;
  onClose: () => void;
  onSent: () => void;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("idea_comments")
        .insert({ project_id: idea.id, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("ideas.noteSent"));
      setBody("");
      void qc.invalidateQueries({ queryKey: ["idea-comments", idea.id] });
      onSent();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("ideas.commentTitle")}</DialogTitle>
          <DialogDescription dir={textDir(idea.title)}>{idea.title}</DialogDescription>
        </DialogHeader>
        <CommentThread projectId={idea.id} />
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) send.mutate();
          }}
        >
          <Label htmlFor="idea-note">{t("ideas.newNote")}</Label>
          <Textarea
            id="idea-note"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && body.trim()) send.mutate();
            }}
            placeholder={t("ideas.notePlaceholder")}
            dir={textDir(body)}
            rows={4}
            maxLength={4000}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">{t("ideas.noteHelp")}</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.close")}
            </Button>
            <Button type="submit" disabled={!body.trim() || send.isPending}>
              <Send className="rtl:-scale-x-100" />
              {t("ideas.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeclineDialog({
  idea,
  pending,
  onClose,
  onConfirm,
}: {
  idea: PendingIdea;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("ideas.declineTitle")}</DialogTitle>
          <DialogDescription dir={textDir(idea.title)}>{idea.title}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="decline-reason">
            {t("ideas.reason")}{" "}
            <span className="font-normal text-muted-foreground">({t("common.optional")})</span>
          </Label>
          <Textarea
            id="decline-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("ideas.reasonPlaceholder")}
            dir={textDir(reason)}
            rows={3}
            maxLength={2000}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {t(isPost(idea) ? "ideas.postDeclineHelp" : "ideas.declineHelp")}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)} disabled={pending}>
            <X />
            {t("ideas.declineConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The finished files of an imported post on its card: the cover or first file of one language
 * version, a summary, and a click opens every stored file full size (images, slides, videos).
 * Signed URLs are only requested for cards near the one in view.
 */
function MediaPreview({
  idea,
  load,
  className,
}: {
  idea: PendingIdea;
  load: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const languages = [...new Set(idea.imported_media.map((m) => m.language))];
  const [lang, setLang] = useState(languages.includes("en") ? "en" : (languages[0] ?? null));
  const [viewing, setViewing] = useState<{ files: ImportedMediaRow[]; index: number } | null>(null);
  const files = idea.imported_media.filter((m) => m.language === lang);
  const stored = files.filter((m) => m.storage_path);
  const urls = useSignedUrls(load ? stored.map((m) => m.storage_path!) : [], "media");
  const first = stored[0];
  const src = first?.storage_path ? urls.data?.[first.storage_path] : undefined;
  const slides =
    files.filter((m) => m.kind === "carousel_slide").length ||
    (files.filter((m) => m.kind === "html").length > 1
      ? files.filter((m) => m.kind === "html").length
      : 0);
  const video = files.find((m) => m.kind === "video");
  const summary = slides
    ? t("ideas.files.slides", { n: slides })
    : video
      ? t("ideas.files.video", { s: Math.round(video.duration ?? 0) })
      : t("ideas.files.images", { n: files.length });
  const live = files.find((m) => m.live_url)?.live_url;

  return (
    <div className={cn("flex shrink-0 flex-col gap-1.5", className)}>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-muted">
        {first ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewing({ files: stored, index: 0 });
            }}
            aria-label={t("ideas.viewFiles")}
            className="group absolute inset-0 cursor-zoom-in focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {first.kind === "html" && (
              <span className="absolute inset-0">
                <HtmlPage row={first} load={load} fill />
              </span>
            )}
            {src && first.mime_type.startsWith("image/") && (
              <img src={src} alt={first.file_name} className="size-full object-contain" />
            )}
            {src && first.mime_type.startsWith("video/") && (
              <video
                key={src}
                src={`${src}#t=0.5`}
                muted
                playsInline
                preload="metadata"
                className="size-full object-contain"
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-90 transition-opacity group-hover:opacity-100">
                {first.mime_type.startsWith("video/") && <Play className="size-3.5 fill-current" />}
                {t("ideas.viewFiles")}
              </span>
            </span>
          </button>
        ) : (
          <div className="flex size-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
            {live ? (
              <a
                href={live}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                {t("finished.onSocial")}
              </a>
            ) : (
              t("ideas.noStoredFiles")
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{summary}</span>
        {languages.length > 1 && (
          <div className="flex gap-1">
            {languages.map((l) => (
              <button
                key={l ?? "all"}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLang(l);
                }}
                aria-pressed={l === lang}
                className={cn(
                  "rounded-full border px-2 py-0.5 font-medium",
                  l === lang ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                )}
              >
                {l ? t(`imported.lang.${l}`) : t("finished.allLanguages")}
              </button>
            ))}
          </div>
        )}
      </div>
      <MediaViewer
        viewing={viewing}
        urls={urls.data ?? {}}
        onIndex={(index) => setViewing((v) => v && { ...v, index })}
        onClose={() => setViewing(null)}
      />
    </div>
  );
}
