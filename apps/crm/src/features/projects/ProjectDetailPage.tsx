import { STAGES, type Stage } from "@cc/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, ExternalLink, Pencil, X } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useProject, useProjectEvents, useProjectJobs } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import { eventLabel } from "./event-label";

/** Pipeline steps shown in the stepper (review stages are folded into their producer). */
const STEPS: { stage: Stage; label: MessageKey }[] = [
  { stage: "intake", label: "project.tab.idea" },
  { stage: "questionnaire", label: "project.tab.questionnaire" },
  { stage: "brief", label: "project.tab.brief" },
  { stage: "script", label: "project.tab.scripts" },
  { stage: "creative", label: "project.tab.creative" },
  { stage: "render", label: "project.tab.media" },
  { stage: "publish", label: "project.tab.publishing" },
];
const stepIndex = (stage: Stage) => {
  const order = STAGES.indexOf(stage);
  let idx = 0;
  STEPS.forEach((s, i) => {
    if (STAGES.indexOf(s.stage) <= order) idx = i;
  });
  return idx;
};

const LATER_TABS: { value: string; label: MessageKey; phase: string }[] = [
  { value: "questionnaire", label: "project.tab.questionnaire", phase: "Phase 2" },
  { value: "brief", label: "project.tab.brief", phase: "Phase 2" },
  { value: "scripts", label: "project.tab.scripts", phase: "Phase 2" },
  { value: "creative", label: "project.tab.creative", phase: "Phase 3" },
  { value: "media", label: "project.tab.media", phase: "Phase 4" },
  { value: "publishing", label: "project.tab.publishing", phase: "Phase 4" },
];

export function ProjectDetailPage() {
  const { id } = useParams();
  const { t, locale, dir } = useI18n();
  const { can } = useWorkspace();
  const project = useProject(id);
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
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge status={p.status} />
            <span>{t(`source.${p.input_source}`)}</span>
            <span>·</span>
            <span title={formatDateTime(p.submitted_at, locale)}>
              {formatRelative(p.submitted_at, locale)}
            </span>
            {p.brands && (
              <>
                <span>·</span>
                <Link to={`/brands/${p.brands.id}`} className="hover:underline">
                  {p.brands.name}
                </Link>
              </>
            )}
            {p.project_tags.map(({ tags: tag }) => (
              <Badge key={tag.id} variant="secondary">
                #{tag.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline stepper */}
      <nav aria-label={t("project.pipeline")} className="mb-6 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-1">
          {STEPS.map((s, i) => {
            const done = i < current || p.status === "published";
            const active = i === current && p.status !== "published";
            return (
              <li key={s.stage} className="flex items-center gap-1">
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                    done && "border-success/40 bg-success/10 text-success",
                    active &&
                      (p.status === "failed"
                        ? "border-destructive/50 bg-destructive/10 text-destructive"
                        : "border-primary/50 bg-primary/10 text-primary"),
                    !done && !active && "text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? (
                    <Check className="size-3" />
                  ) : (
                    <span className="tabular-nums">{i + 1}</span>
                  )}
                  {t(s.label)}
                </span>
                {i < STEPS.length - 1 && (
                  <span className={cn("h-px w-4", done ? "bg-success/50" : "bg-border")} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Tabs defaultValue="idea" dir={dir}>
          <TabsList>
            <TabsTrigger value="idea">{t("project.tab.idea")}</TabsTrigger>
            {LATER_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {t(tab.label)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="history">{t("project.tab.history")}</TabsTrigger>
          </TabsList>

          <TabsContent value="idea" className="flex flex-col gap-4">
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

          {LATER_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <EmptyState message={t("placeholder.tab", { phase: tab.phase })} />
            </TabsContent>
          ))}

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

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("project.details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">{t("project.stage")}</dt>
                <dd>{t(STEPS[current]!.label)}</dd>
                <dt className="text-muted-foreground">{t("project.brand")}</dt>
                <dd>{p.brands?.name ?? t("project.noBrand")}</dd>
                <dt className="text-muted-foreground">{t("project.format")}</dt>
                <dd>{p.content_type ? t(`contentType.${p.content_type}`) : "—"}</dd>
                <dt className="text-muted-foreground">{t("project.language")}</dt>
                <dd>{p.language ?? "—"}</dd>
                <dt className="text-muted-foreground">{t("project.submitted")}</dt>
                <dd>{formatDateTime(p.submitted_at, locale)}</dd>
              </dl>
            </CardContent>
          </Card>
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
