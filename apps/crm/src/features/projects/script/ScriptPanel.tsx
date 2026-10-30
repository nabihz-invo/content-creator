import type { Script } from "@cc/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  MessageSquareWarning,
  PencilLine,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { type ScriptRow, useApprovals, useScripts, WORKING_STATUSES } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import type { ContentProject } from "@/types/db";
import { ScriptView } from "./ScriptView";

const STATUS_VARIANT: Record<
  ScriptRow["status"],
  "info" | "warning" | "success" | "destructive" | "outline"
> = {
  in_review: "info",
  changes_requested: "warning",
  approved: "success",
  rejected: "destructive",
  superseded: "outline",
};

export function ScriptPanel({ project }: { project: ContentProject }) {
  const { t, locale } = useI18n();
  const { can } = useWorkspace();
  const scripts = useScripts(project.id, WORKING_STATUSES.has(project.status));
  const approvals = useApprovals(project.id);
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | "changes" | "reject" | "edit" | "regenerate">(null);
  const qc = useQueryClient();

  const list = scripts.data ?? [];
  const current = list.find((s) => s.id === selected) ?? list[0];
  const previous = current ? list.find((s) => s.version === current.version - 1) : undefined;
  const writing = project.status === "generating_script";
  const actionable = current?.status === "in_review" && project.status === "script_in_review";

  const refresh = () => {
    setSelected(null);
    for (const key of [
      "project",
      "scripts",
      "approvals",
      "project-events",
      "project-jobs",
      "status-counts",
    ])
      void qc.invalidateQueries({ queryKey: [key] });
  };

  const decide = useMutation({
    mutationFn: (input: {
      decision: "approved" | "changes_requested" | "rejected";
      comment?: string;
    }) =>
      api.decide({
        artifact_type: "script",
        artifact_id: current!.id,
        artifact_version: current!.version,
        artifact_hash: current!.content_hash,
        ...input,
      }),
    onSuccess: (_r, input) => {
      toast.success(
        input.decision === "approved"
          ? t("script.approvedToast")
          : input.decision === "changes_requested"
            ? t("script.changesSent")
            : t("decision.rejected"),
      );
      setDialog(null);
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  if (writing && !list.length) {
    return <Working text={t("script.writing")} />;
  }
  if (!current) return <p className="text-sm text-muted-foreground">{t("script.empty")}</p>;

  return (
    <div className="flex flex-col gap-4">
      {writing && (
        <Working
          text={
            project.status === "generating_script" ? t("script.regenerating") : t("script.writing")
          }
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {list.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelected(s.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition hover:border-primary/40",
              s.id === current.id && "border-primary bg-primary/5",
            )}
          >
            {t("script.version", { n: s.version })}
            <Badge variant={STATUS_VARIANT[s.status]}>
              {t(`script.status.${s.status}` as MessageKey)}
            </Badge>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base" dir={textDir(current.content.title)}>
              {current.content.title}
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              {t(`script.origin.${current.origin}` as MessageKey)}
              {current.model && current.origin !== "manual_edit"
                ? ` · ${current.model}`
                : ""} · {formatRelative(current.created_at, locale)}
            </div>
          </div>
          {actionable ? (
            <div className="flex flex-wrap gap-2">
              {can("edit") && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setDialog("edit")}>
                    <PencilLine />
                    {t("script.edit")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDialog("regenerate")}>
                    <RefreshCw />
                    {t("script.regenerate")}
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setDialog("reject")}>
                <XCircle />
                {t("script.reject")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDialog("changes")}>
                <MessageSquareWarning />
                {t("script.requestChanges")}
              </Button>
              <Button
                size="sm"
                onClick={() => decide.mutate({ decision: "approved" })}
                disabled={decide.isPending}
              >
                {decide.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                {t("script.approve")}
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{t("script.readonly")}</span>
          )}
        </CardHeader>
        <CardContent>
          <ScriptView script={current.content} previous={previous?.content} />
        </CardContent>
      </Card>

      <ReviewHistory
        approvals={(approvals.data ?? []).filter(
          (a) => a.stage === "script" || a.stage === "config",
        )}
        scripts={list}
      />

      <TextDialog
        open={dialog === "changes"}
        onClose={() => setDialog(null)}
        title={t("script.requestChanges")}
        label={t("script.comment")}
        submitLabel={t("script.requestChanges")}
        pending={decide.isPending}
        onSubmit={(comment) => decide.mutate({ decision: "changes_requested", comment })}
      />
      <RegenerateDialog
        open={dialog === "regenerate"}
        onClose={() => setDialog(null)}
        projectId={project.id}
        onDone={refresh}
      />
      <Dialog open={dialog === "reject"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("script.reject")}</DialogTitle>
            <DialogDescription>{t("script.rejectConfirm")}</DialogDescription>
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
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialog === "edit" && (
        <EditDialog
          projectId={project.id}
          script={current}
          onClose={() => setDialog(null)}
          onDone={refresh}
        />
      )}
    </div>
  );
}

function Working({ text }: { text: string }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-3">
        <Loader2 className="size-5 animate-spin text-primary" />
        {text}
      </CardContent>
    </Card>
  );
}

function ReviewHistory({
  approvals,
  scripts,
}: {
  approvals: ReturnType<typeof useApprovals>["data"];
  scripts: ScriptRow[];
}) {
  const { t, locale } = useI18n();
  if (!approvals?.length) return null;
  const version = (id: string) => scripts.find((s) => s.id === id)?.version;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("script.history")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3 text-sm">
          {approvals.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start gap-2">
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
              <span className="font-medium">
                {t(`approval.stage.${a.stage}` as MessageKey)}
                {a.stage === "script" && version(a.artifact_id)
                  ? ` · ${t("script.version", { n: version(a.artifact_id)! })}`
                  : ""}
              </span>
              <span className="text-muted-foreground">{formatRelative(a.created_at, locale)}</span>
              {a.comment && (
                <p className="w-full rounded-md bg-muted/50 px-3 py-2" dir={textDir(a.comment)}>
                  {a.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TextDialog(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (text: string) => void;
}) {
  const { t, dir } = useI18n();
  const [text, setText] = useState("");
  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && props.onClose()}>
      <DialogContent dir={dir} closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dialog-text">{props.label}</Label>
          <Textarea
            id="dialog-text"
            rows={4}
            dir="auto"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => props.onSubmit(text.trim())}
            disabled={props.pending || text.trim().length < 3}
          >
            {props.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegenerateDialog({
  open,
  onClose,
  projectId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const regen = useMutation({
    mutationFn: (instructions: string) => api.regenerateScript(projectId, instructions),
    onSuccess: () => {
      toast.success(t("script.regenerating"));
      onClose();
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <TextDialog
      open={open}
      onClose={onClose}
      title={t("script.regenerate")}
      label={t("script.instructions")}
      submitLabel={t("script.regenerate")}
      pending={regen.isPending}
      onSubmit={(text) => regen.mutate(text)}
    />
  );
}

type Path = (string | number)[];

/** Text fields a person may edit; timing and structure stay as approved by the format rules. */
function editableFields(s: Script): { path: Path; label: string; multiline?: boolean }[] {
  const out: { path: Path; label: string; multiline?: boolean }[] = [];
  const any = s as unknown as Record<string, unknown>;
  if (Array.isArray(any.scenes)) {
    out.push({ path: ["hook"], label: "script.hook" });
    (any.scenes as { voiceover: string | null }[]).forEach((sc, i) => {
      out.push({ path: ["scenes", i, "on_screen_text"], label: `${i + 1}|script.onScreen` });
      if (sc.voiceover !== null)
        out.push({
          path: ["scenes", i, "voiceover"],
          label: `${i + 1}|script.voiceover`,
          multiline: true,
        });
      out.push({ path: ["scenes", i, "visual"], label: `${i + 1}|script.visual`, multiline: true });
    });
    out.push({ path: ["closing_cta"], label: "script.closingCta" });
  } else if (Array.isArray(any.slides)) {
    (any.slides as unknown[]).forEach((_, i) => {
      out.push({ path: ["slides", i, "headline"], label: `${i + 1}|script.headline` });
      out.push({
        path: ["slides", i, "supporting_text"],
        label: `${i + 1}|script.supportingText`,
        multiline: true,
      });
    });
    out.push({ path: ["cta"], label: "brief.cta" });
  } else {
    out.push(
      { path: ["headline"], label: "script.headline" },
      { path: ["body"], label: "script.body", multiline: true },
      { path: ["cta"], label: "brief.cta" },
    );
  }
  out.push({ path: ["caption"], label: "script.caption", multiline: true });
  return out;
}

const getAt = (o: unknown, p: Path): string =>
  String(p.reduce<unknown>((acc, k) => (acc as Record<string | number, unknown>)?.[k], o) ?? "");
function setAt<T>(o: T, p: Path, v: string): T {
  const copy = structuredClone(o);
  let cur = copy as Record<string | number, unknown>;
  for (const k of p.slice(0, -1)) cur = cur[k] as Record<string | number, unknown>;
  cur[p.at(-1)!] = v;
  return copy;
}

function EditDialog({
  projectId,
  script,
  onClose,
  onDone,
}: {
  projectId: string;
  script: ScriptRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, dir } = useI18n();
  const [content, setContent] = useState<Script>(() => structuredClone(script.content));
  const [key] = useState(() => crypto.randomUUID());
  const save = useMutation({
    mutationFn: () => api.editScript(projectId, script.id, content, key),
    onSuccess: (r) => {
      toast.success(t("script.saved", { n: r.version }));
      onClose();
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });
  const label = (l: string): ReactNode => {
    const [n, k] = l.includes("|") ? l.split("|") : [null, l];
    return n ? `${t("script.scene", { n })} · ${t(k as MessageKey)}` : t(k as MessageKey);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir={dir} className="sm:max-w-2xl" closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>
            {t("script.edit")} · {t("script.version", { n: script.version })}
          </DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[60dvh] flex-col gap-3 overflow-y-auto pe-1">
          {editableFields(script.content).map((f) => {
            const id = f.path.join(".");
            const value = getAt(content, f.path);
            return (
              <div key={id} className="flex flex-col gap-1.5">
                <Label htmlFor={id} className="text-xs text-muted-foreground">
                  {label(f.label)}
                </Label>
                {f.multiline ? (
                  <Textarea
                    id={id}
                    rows={2}
                    dir="auto"
                    value={value}
                    onChange={(e) => setContent((c) => setAt(c, f.path, e.target.value))}
                  />
                ) : (
                  <Input
                    id={id}
                    dir="auto"
                    value={value}
                    onChange={(e) => setContent((c) => setAt(c, f.path, e.target.value))}
                  />
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
