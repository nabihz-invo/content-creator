import {
  type Analysis,
  type AnswerError,
  type Answers,
  isAiDecide,
  isVisible,
  suggestedAnswers,
  validateAnswers,
} from "@cc/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  HelpCircle,
  Loader2,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import {
  type QuestionnaireRow,
  useAnalysis,
  useQuestionnaires,
  WORKING_STATUSES,
} from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";
import type { ContentProject } from "@/types/db";
import { QuestionField } from "./QuestionField";

export function ConfigPanel({ project }: { project: ContentProject }) {
  const { t } = useI18n();
  const working = WORKING_STATUSES.has(project.status);
  const qs = useQuestionnaires(project.id, working);
  const initial = [...(qs.data ?? [])].reverse().find((q) => q.kind === "initial");
  const clarification = [...(qs.data ?? [])]
    .reverse()
    .find((q) => q.kind === "clarification" && q.status === "awaiting_answers");
  const analysis = useAnalysis(initial?.analysis_id);

  if (project.status === "analyzing" || (!initial && project.status === "new")) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-4">
          <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
          <div>
            <div className="font-medium">{t("config.analyzing.title")}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t("config.analyzing.body")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!initial) return <p className="text-sm text-muted-foreground">{t("config.pending")}</p>;

  return (
    <div className="flex flex-col gap-4">
      {analysis.data && (
        <AnalysisSummary analysis={analysis.data.analysis} model={analysis.data.model} />
      )}
      {project.status === "needs_clarification" && clarification && (
        <ConfigForm project={project} q={clarification} mode="clarification" />
      )}
      {initial.status === "awaiting_answers" ? (
        <ConfigForm project={project} q={initial} mode="review" />
      ) : (
        <ApprovedConfig project={project} q={initial} />
      )}
    </div>
  );
}

function AnalysisSummary({ analysis: a, model }: { analysis: Analysis; model: string | null }) {
  const { t, locale } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="size-4 text-primary" />
          {t("config.summary.title")}
          {model && (
            <span className="ms-auto text-xs font-normal text-muted-foreground">{model}</span>
          )}
        </CardTitle>
        <CardDescription>{a.summary[locale]}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            {t("config.summary.format")}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">{t(`contentType.${a.proposed_format}` as MessageKey)}</Badge>
            <span className="text-muted-foreground">{a.format_rationale[locale]}</span>
          </div>
        </div>
        {a.missing_information.length > 0 && (
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <HelpCircle className="size-3.5" />
              {t("config.summary.missing")}
            </div>
            <ul className="list-disc ps-5">
              {a.missing_information.map((m, i) => (
                <li key={i}>{m[locale]}</li>
              ))}
            </ul>
          </div>
        )}
        {a.claims_to_verify.length > 0 && (
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-warning">
              <AlertTriangle className="size-3.5" />
              {t("config.summary.claims")}
            </div>
            <ul className="list-disc ps-5">
              {a.claims_to_verify.map((c, i) => (
                <li key={i}>
                  <span dir={textDir(c.claim)}>{c.claim}</span> —{" "}
                  <span className="text-muted-foreground">{c.reason[locale]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {a.risk_flags.length > 0 && (
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-destructive">
              <ShieldAlert className="size-3.5" />
              {t("config.summary.risks")}
            </div>
            <ul className="list-disc ps-5">
              {a.risk_flags.map((r, i) => (
                <li key={i}>{r[locale]}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function startingAnswers(q: QuestionnaireRow, fromApproved: boolean): Answers {
  const draft = q.questionnaire_answers.find((a) => a.is_draft);
  const current = q.questionnaire_answers.find((a) => !a.is_draft && a.status === "current");
  if (fromApproved && current) return current.answers;
  return draft?.answers ?? current?.answers ?? suggestedAnswers(q.questions);
}

function ConfigForm({
  project,
  q,
  mode,
  onDone,
}: {
  project: ContentProject;
  q: QuestionnaireRow;
  mode: "review" | "clarification" | "change";
  onDone?: () => void;
}) {
  const { t, locale } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
  const readOnly = !can("edit");
  const [answers, setAnswers] = useState<Answers>(() => startingAnswers(q, mode === "change"));
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, AnswerError>>({});

  const check = useMemo(() => validateAnswers(q.questions, answers), [q.questions, answers]);
  const errors = showErrors ? { ...check.errors, ...serverErrors } : {};
  const visible = q.questions.questions.filter((x) => isVisible(x, answers, q.questions.questions));

  const refresh = () => {
    for (const key of [
      "project",
      "questionnaires",
      "project-events",
      "project-jobs",
      "brief",
      "scripts",
      "approvals",
      "status-counts",
    ]) {
      void qc.invalidateQueries({ queryKey: [key] });
    }
  };

  const save = useMutation({
    mutationFn: (draft: boolean) =>
      api.submitConfiguration(project.id, { questionnaire_id: q.id, answers, draft }),
    onSuccess: (_r, draft) => {
      if (draft) {
        toast.success(t("config.draftSaved"));
        void qc.invalidateQueries({ queryKey: ["questionnaires", project.id] });
        return;
      }
      toast.success(t("config.approved"));
      refresh();
      onDone?.();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "validation_failed" && e.body.details?.fields) {
        setServerErrors(e.body.details.fields as Record<string, AnswerError>);
        setShowErrors(true);
      }
      toast.error(e.message);
    },
  });

  function approve() {
    setShowErrors(true);
    setServerErrors({});
    if (!check.valid) {
      const first = Object.keys(check.errors)[0];
      document
        .querySelector(`[data-question="${first}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    save.mutate(false);
  }

  const groups = q.questions.groups.filter((g) => visible.some((x) => x.group === g.id));
  const errorCount = Object.keys(errors).length;

  return (
    <Card className={mode === "clarification" ? "border-warning/50" : undefined}>
      <CardHeader>
        <CardTitle className="text-base">
          {mode === "clarification"
            ? t("config.clarify.title")
            : mode === "change"
              ? t("config.editApproved")
              : t("config.review.title")}
        </CardTitle>
        <CardDescription>
          {mode === "clarification"
            ? t("config.clarify.subtitle")
            : mode === "change"
              ? t("config.editWarning")
              : t("config.review.subtitle")}
        </CardDescription>
        {readOnly && <p className="text-sm text-warning">{t("config.readonly")}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {groups.map((g) => (
          <section key={g.id} className="flex flex-col gap-4">
            <h3 className="border-b pb-2 text-sm font-semibold">{g.label[locale]}</h3>
            {visible
              .filter((x) => x.group === g.id)
              .map((question) => (
                <QuestionField
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  error={errors[question.id]}
                  disabled={readOnly}
                  onChange={(v) =>
                    setAnswers((prev) => {
                      const next = { ...prev };
                      if (v === undefined) delete next[question.id];
                      else next[question.id] = v;
                      return next;
                    })
                  }
                />
              ))}
          </section>
        ))}

        {!readOnly && (
          <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-2 border-t bg-card/95 px-5 pt-4 pb-1 backdrop-blur">
            {errorCount > 0 && (
              <span className="text-sm text-destructive">
                {t("config.fixErrors", { n: errorCount })}
              </span>
            )}
            <div className="ms-auto flex gap-2">
              {mode === "change" && (
                <Button variant="ghost" onClick={onDone}>
                  {t("common.cancel")}
                </Button>
              )}
              {mode === "review" && (
                <Button
                  variant="outline"
                  onClick={() => save.mutate(true)}
                  disabled={save.isPending}
                >
                  <Save />
                  {t("config.saveDraft")}
                </Button>
              )}
              <Button onClick={approve} disabled={save.isPending}>
                {save.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                {mode === "clarification" ? t("config.clarify.submit") : t("config.approve")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ApprovedConfig({ project, q }: { project: ContentProject; q: QuestionnaireRow }) {
  const { t, locale } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
  const [changing, setChanging] = useState(false);
  const current = q.questionnaire_answers.find((a) => !a.is_draft && a.status === "current");
  const answers = current?.answers ?? {};
  const changeable = [
    "validating_answers",
    "needs_clarification",
    "generating_script",
    "script_in_review",
    "generating_creative",
    "creative_in_review",
    "rendering",
    "media_in_review",
  ].includes(project.status);
  const reanalyze = useMutation({
    mutationFn: () => api.analyze(project.id),
    onSuccess: () => {
      toast.success(t("config.reanalyzed"));
      void qc.invalidateQueries({ queryKey: ["project", project.id] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (changing)
    return <ConfigForm project={project} q={q} mode="change" onDone={() => setChanging(false)} />;

  const shown = q.questions.questions.filter((x) => isVisible(x, answers, q.questions.questions));
  const display = (id: string) => {
    const v = answers[id];
    const question = q.questions.questions.find((x) => x.id === id)!;
    if (v === undefined)
      return <span className="text-muted-foreground">{t("config.notAnswered")}</span>;
    if (isAiDecide(v)) return <Badge variant="info">{t("config.aiDecide")}</Badge>;
    const values = Array.isArray(v) ? v : [v];
    const labels = values.map(
      (x) => question.options?.find((o) => o.value === x)?.label[locale] ?? x,
    );
    if (question.type === "color") {
      return (
        <span className="inline-flex items-center gap-2 font-mono">
          <span className="size-4 rounded-full border" style={{ background: String(v) }} />
          {String(v)}
        </span>
      );
    }
    return (
      <span className="whitespace-pre-wrap" dir={textDir(labels.join(" "))}>
        {labels.join(", ")}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-4 text-success" />
            {t("config.approvedTitle")}
          </CardTitle>
          {current?.submitted_at && (
            <CardDescription>{formatDateTime(current.submitted_at, locale)}</CardDescription>
          )}
        </div>
        {can("edit") && (
          <div className="flex gap-2">
            {project.status === "awaiting_answers" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reanalyze.mutate()}
                disabled={reanalyze.isPending}
              >
                <RefreshCw />
                {t("config.reanalyze")}
              </Button>
            )}
            {changeable && (
              <Button variant="outline" size="sm" onClick={() => setChanging(true)}>
                {t("config.editApproved")}
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[14rem_1fr]">
          {shown.map((x) => (
            <div key={x.id} className="contents">
              <dt className="text-muted-foreground">{x.label[locale]}</dt>
              <dd>{display(x.id)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
