import { STAGES, type Stage } from "@cc/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, ExternalLink, History, Pencil, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { formatDateTime, formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { api } from "@/lib/api";
import { useProject, useProjectEvents, useProjectJobs } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import { BriefPanel } from "./BriefPanel";
import { ConfigPanel } from "./config/ConfigPanel";
import { CreativePanel } from "./creative/CreativePanel";
import { eventLabel } from "./event-label";
import { FinishedMedia } from "./FinishedMedia";
import { ImportedContentCard } from "./ImportedContentCard";
import { MediaPanel } from "./media/MediaPanel";
import { PublishingPanel } from "./publishing/PublishingPanel";
import { ScriptPanel } from "./script/ScriptPanel";

/** Pipeline steps shown in the stepper (review stages are folded into their producer). */
const STEPS: { stage: Stage; label: MessageKey; tab: string }[] = [
  { stage: "intake", label: "project.tab.idea", tab: "idea" },
  { stage: "questionnaire", label: "project.tab.configuration", tab: "configuration" },
  { stage: "brief", label: "project.tab.brief", tab: "brief" },
  { stage: "script", label: "project.tab.scripts", tab: "script" },
  { stage: "creative", label: "project.tab.creative", tab: "creative" },
  { stage: "render", label: "project.tab.media", tab: "media" },
  { stage: "publish", label: "project.tab.publishing", tab: "publishing" },
];
const stepIndex = (stage: Stage) => {
  const order = STAGES.indexOf(stage);
  let idx = 0;
  STEPS.forEach((s, i) => {
    if (STAGES.indexOf(s.stage) <= order) idx = i;
  });
  return idx;
};

/** The tab that needs the user's attention for a status. */
function tabFor(status: string): string {
  if (["analyzing", "awaiting_answers", "needs_clarification"].includes(status))
    return "configuration";
  if (status === "validating_answers") return "brief";
  if (["generating_script", "script_in_review"].includes(status)) return "script";
  if (["generating_creative", "creative_in_review"].includes(status)) return "creative";
  if (["rendering", "media_in_review"].includes(status)) return "media";
  if (["ready_to_publish", "scheduled", "publishing", "published"].includes(status))
    return "publishing";
  return "idea";
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const { t, locale, dir } = useI18n();
  const { can } = useWorkspace();
  const project = useProject(id);
  // null = follow the project's status; a click pins the chosen tab.
  const [tab, setTab] = useState<string | null>(null);
  const qc = useQueryClient();
  const status = project.data?.status;
  // A status change means jobs, history, and artifacts moved: refresh them now rather than on the next poll.
  useEffect(() => {
    if (!status) return;
    for (const key of [
      "project-jobs",
      "project-events",
      "questionnaires",
      "brief",
      "scripts",
      "approvals",
      "creatives",
      "renders",
      "publishing",
    ]) {
      void qc.invalidateQueries({ queryKey: [key] });
    }
  }, [status, qc]);
  const events = useProjectEvents(id);
  const jobs = useProjectJobs(id);

  if (project.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-16 w-full" />
        <ListSkeleton rows={4} />
      </div>
    );
  }
  if (project.isError)
    return <ErrorState error={project.error} onRetry={() => void project.refetch()} />;
  const p = project.data;
  if (!p) return <EmptyState message={t("project.notFound")} />;

  const current = stepIndex(p.current_stage);
  const extracted = p.source_metadata?.extracted;
  const imported = p.source_metadata.origin === "content_plan_import";
  const shown = tab ?? tabFor(p.status);

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-3 -ms-2">
        <Link to="/inbox">
          <ArrowLeft className="rtl:-scale-x-100" />
          {t("nav.inbox")}
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <EditableTitle projectId={p.id} title={p.title} editable={can("edit")} />
        </div>
        {/* Imported posts with finished files are reviewed as they are (FinishedMedia), not regenerated. */}
        {p.status === "new" && can("edit") && !p.source_metadata.finished && (
          <StartPipelineButton projectId={p.id} />
        )}
      </div>

      {/* The pipeline steps are the page's tabs: progress and navigation in one place. */}
      <nav aria-label={t("project.pipeline")} className="mb-6 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-1" role="tablist">
          {STEPS.map((s, i) => {
            const done = i < current || p.status === "published";
            const active = i === current && p.status !== "published";
            const selected = shown === s.tab;
            return (
              <li key={s.stage} className="flex items-center gap-1">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-current={active ? "step" : undefined}
                  onClick={() => setTab(s.tab)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    done && "border-success/40 bg-success/10 text-success",
                    active &&
                      (p.status === "failed"
                        ? "border-destructive/50 bg-destructive/10 text-destructive"
                        : "border-primary/50 bg-primary/10 text-primary"),
                    !done && !active && "text-muted-foreground",
                    selected && "ring-2 ring-ring ring-offset-1 ring-offset-background",
                  )}
                >
                  {done ? (
                    <Check className="size-3" />
                  ) : (
                    <span className="tabular-nums">{i + 1}</span>
                  )}
                  {t(s.label)}
                </button>
                <span className={cn("h-px w-4", done ? "bg-success/50" : "bg-border")} />
              </li>
            );
          })}
          <li>
            <button
              type="button"
              role="tab"
              aria-selected={shown === "history"}
              onClick={() => setTab("history")}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                shown === "history" && "ring-2 ring-ring ring-offset-1 ring-offset-background",
              )}
            >
              <History className="size-3" />
              {t("project.tab.history")}
            </button>
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Tabs value={shown} onValueChange={setTab} dir={dir}>
          <TabsContent value="idea" className="mt-0 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("project.originalIdea")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed whitespace-pre-wrap" dir={textDir(p.original_idea)}>
                  {p.original_idea}
                </p>
                {p.duplicate_of && (
                  <Link
                    to={`/projects/${p.duplicate_of}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-warning hover:underline"
                  >
                    <Copy className="size-3.5" />
                    {t("project.duplicateOf")}
                  </Link>
                )}
              </CardContent>
            </Card>
            {p.source_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("project.sourceLink")}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <a
                    href={p.source_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 break-all text-sm text-primary hover:underline"
                    dir="ltr"
                  >
                    {p.source_url}
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                  {extracted ? (
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <div className="mb-1 text-xs font-medium text-muted-foreground">
                        {t("project.extracted")}
                      </div>
                      {extracted.title && (
                        <div className="font-medium" dir={textDir(extracted.title)}>
                          {extracted.title}
                        </div>
                      )}
                      <p
                        className="mt-1 line-clamp-6 whitespace-pre-wrap text-muted-foreground"
                        dir={textDir(extracted.text)}
                      >
                        {extracted.text}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("project.extractedPending")}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="configuration">
            <ConfigPanel project={p} />
          </TabsContent>
          <TabsContent value="brief">
            <BriefPanel project={p} />
          </TabsContent>
          <TabsContent value="script">
            <ScriptPanel project={p} />
          </TabsContent>
          <TabsContent value="creative">
            <CreativePanel project={p} />
          </TabsContent>

          <TabsContent value="media">
            {/* Finished files of an imported post are in the card on the right. */}
            {imported && p.source_metadata.finished ? (
              <p className="text-sm text-muted-foreground">{t("project.importedSideHint")}</p>
            ) : (
              <MediaPanel project={p} />
            )}
          </TabsContent>
          <TabsContent value="publishing">
            {imported && p.status !== "ready_to_publish" ? (
              <p className="text-sm text-muted-foreground">{t("project.importedSideHint")}</p>
            ) : (
              <PublishingPanel project={p} />
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent>
                {events.isLoading ? (
                  <ListSkeleton rows={4} />
                ) : !events.data?.length ? (
                  <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
                ) : (
                  <ol className="relative flex flex-col gap-4 border-s ps-5">
                    {events.data.map((e) => (
                      <li key={e.id} className="relative">
                        <span
                          className={cn(
                            "absolute -start-[1.6rem] top-1.5 size-2.5 rounded-full border-2 border-card",
                            e.event_type.includes("needs_attention") ||
                              e.event_type.endsWith("failed")
                              ? "bg-destructive"
                              : e.event_type === "status.changed"
                                ? "bg-primary"
                                : "bg-muted-foreground/50",
                          )}
                        />
                        <div className="text-sm">{eventLabel(e, locale)}</div>
                        <div
                          className="text-xs text-muted-foreground"
                          title={formatDateTime(e.created_at, locale)}
                        >
                          {formatRelative(e.created_at, locale)} {e.actor_id ? "" : "· system"}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("project.details")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">{t("project.status")}</dt>
                <dd>
                  <StatusBadge status={p.status} />
                </dd>
                <dt className="text-muted-foreground">{t("project.stage")}</dt>
                <dd>{t(STEPS[current]!.label)}</dd>
                <dt className="text-muted-foreground">{t("project.publishDate")}</dt>
                <dd>
                  <PublishDateField
                    projectId={p.id}
                    value={p.source_metadata.publish_date?.slice(0, 10) ?? ""}
                    editable={can("edit")}
                  />
                </dd>
                <dt className="text-muted-foreground">{t("project.brand")}</dt>
                <dd>
                  {p.brands ? (
                    <Link to={`/brands/${p.brands.id}`} className="hover:underline">
                      {p.brands.name}
                    </Link>
                  ) : (
                    t("project.noBrand")
                  )}
                </dd>
                <dt className="text-muted-foreground">{t("project.format")}</dt>
                <dd>{p.content_type ? t(`contentType.${p.content_type}`) : "—"}</dd>
                <dt className="text-muted-foreground">{t("project.language")}</dt>
                <dd>{p.language ?? "—"}</dd>
                <dt className="text-muted-foreground">{t("project.source")}</dt>
                <dd>{t(`source.${p.input_source}`)}</dd>
                <dt className="text-muted-foreground">{t("project.submitted")}</dt>
                <dd title={formatDateTime(p.submitted_at, locale)}>
                  {formatRelative(p.submitted_at, locale)}
                </dd>
              </dl>
              {p.project_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5" aria-label={t("project.tags")}>
                  {p.project_tags.map(({ tags: tag }) => (
                    <Badge key={tag.id} variant="secondary">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {imported && <FinishedMedia project={p} />}
          <ImportedContentCard project={p} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("project.jobs")}</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.data?.length ? (
                <ul className="flex flex-col gap-2 text-sm">
                  {jobs.data.map((j) => (
                    <li key={j.id} className="flex items-center justify-between gap-2">
                      <span>{j.stage}</span>
                      <Badge
                        variant={
                          j.status === "succeeded"
                            ? "success"
                            : j.status === "needs_attention"
                              ? "destructive"
                              : j.status === "running"
                                ? "info"
                                : "secondary"
                        }
                      >
                        {j.status} {j.attempts > 0 && `· ${j.attempts}/${j.max_attempts}`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

/** The planned publish day; saved when it changes. Downloads are named with it. */
function PublishDateField({
  projectId,
  value,
  editable,
}: {
  projectId: string;
  value: string;
  editable: boolean;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (date: string) => api.setPublishDate(projectId, date || null),
    onSuccess: () => {
      toast.success(t("project.publishDateSaved"));
      for (const key of ["project", "project-events", "projects"])
        void qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(e.message),
  });
  if (!editable) return <span dir="ltr">{value || "—"}</span>;
  return (
    <Input
      type="date"
      dir="ltr"
      aria-label={t("project.publishDate")}
      className="h-8 w-auto"
      defaultValue={value}
      key={value}
      disabled={save.isPending}
      onChange={(e) => {
        if (e.target.value !== value) save.mutate(e.target.value);
      }}
    />
  );
}

/** Starts the AI pipeline for a new idea: analysis first, then each stage waits for its approval. */
function StartPipelineButton({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const start = useMutation({
    mutationFn: () => api.analyze(projectId),
    onSuccess: () => {
      toast.success(t("project.started"));
      for (const key of ["project", "project-jobs", "project-events", "projects", "status-counts"])
        void qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Button onClick={() => start.mutate()} disabled={start.isPending} className="shrink-0">
      <Sparkles />
      {t("project.start")}
    </Button>
  );
}

function EditableTitle({
  projectId,
  title,
  editable,
}: {
  projectId: string;
  title: string;
  editable: boolean;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("content_projects")
        .update({ title: value.trim() })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ["project", projectId] });
      void qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <h1 className="text-2xl font-semibold tracking-tight break-words" dir={textDir(title)}>
          {title}
        </h1>
        {editable && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-60 group-hover:opacity-100"
            onClick={() => setEditing(true)}
            aria-label={t("project.editTitle")}
          >
            <Pencil />
          </Button>
        )}
      </div>
    );
  }
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) save.mutate();
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={200}
        autoFocus
        dir={textDir(value)}
        className="text-lg font-semibold"
      />
      <Button type="submit" size="icon" disabled={save.isPending} aria-label={t("common.save")}>
        <Check />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => setEditing(false)}
        aria-label={t("common.cancel")}
      >
        <X />
      </Button>
    </form>
  );
}
