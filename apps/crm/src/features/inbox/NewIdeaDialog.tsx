import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, type CreateProjectInput } from "@/lib/api";
import { textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useBrands } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";

export function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,،;]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

export function NewIdeaDialog({ children }: { children: ReactNode }) {
  const { t, dir } = useI18n();
  const { workspaceId } = useWorkspace();
  const brands = useBrands(workspaceId);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [url, setUrl] = useState("");
  const [brandId, setBrandId] = useState("");
  const [contentType, setContentType] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  // One key per draft: a double-click or retry can never create two projects.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function reset() {
    setIdea("");
    setUrl("");
    setBrandId("");
    setContentType("");
    setTags("");
    setError(null);
    setDuplicateOf(null);
    setIdempotencyKey(crypto.randomUUID());
  }

  const create = useMutation({
    mutationFn: (allowDuplicate: boolean) => {
      const input: CreateProjectInput = {
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
        ...(idea.trim() ? { original_idea: idea.trim() } : {}),
        ...(url.trim() ? { source_url: url.trim() } : {}),
        ...(brandId ? { brand_id: brandId } : {}),
        ...(contentType ? { content_type: contentType as CreateProjectInput["content_type"] } : {}),
        ...(tags.trim() ? { tags: parseTags(tags) } : {}),
        ...(allowDuplicate ? { allow_duplicate: true } : {}),
      };
      return api.createProject(input, allowDuplicate ? `${idempotencyKey}:dup` : idempotencyKey);
    },
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      void qc.invalidateQueries({ queryKey: ["status-counts"] });
      if (!r.created && r.duplicate_of && !r.replayed) {
        setDuplicateOf(r.duplicate_of);
        return;
      }
      toast.success(t("idea.created"));
      setOpen(false);
      reset();
      navigate(`/projects/${r.project_id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "validation_failed") {
        const errors =
          (err.body.details?.errors as { path: string; message: string }[] | undefined) ?? [];
        setError(
          errors.map((e) => `${e.path.replace(/^\//, "")}: ${e.message}`).join(" · ") ||
            err.message,
        );
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!idea.trim() && !url.trim()) {
      setError(t("idea.needTextOrUrl"));
      return;
    }
    create.mutate(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent dir={dir} closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("idea.new")}</DialogTitle>
          <DialogDescription>{t("idea.newDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="idea-text">{t("idea.text")}</Label>
            <Textarea
              id="idea-text"
              rows={4}
              dir={textDir(idea)}
              placeholder={t("idea.textPlaceholder")}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="idea-url">{t("idea.url")}</Label>
            <Input
              id="idea-url"
              type="url"
              dir="ltr"
              inputMode="url"
              placeholder={t("idea.urlPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="idea-brand">{t("idea.brand")}</Label>
              <NativeSelect
                id="idea-brand"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="">{t("common.none")}</option>
                {brands.data?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="idea-type">{t("idea.contentType")}</Label>
              <NativeSelect
                id="idea-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="">{t("idea.contentTypeAuto")}</option>
                <option value="static">{t("contentType.static")}</option>
                <option value="carousel">{t("contentType.carousel")}</option>
                <option value="video">{t("contentType.video")}</option>
              </NativeSelect>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="idea-tags">
              {t("idea.tags")}{" "}
              <span className="font-normal text-muted-foreground">({t("common.optional")})</span>
            </Label>
            <Input
              id="idea-tags"
              placeholder={t("idea.tagsPlaceholder")}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {duplicateOf && (
            <div
              role="status"
              className="flex flex-col gap-3 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm sm:flex-row sm:items-center"
            >
              <span className="flex-1">{t("idea.duplicate")}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/projects/${duplicateOf}`)}
                >
                  {t("idea.openExisting")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => create.mutate(true)}
                  disabled={create.isPending}
                >
                  {t("idea.createAnyway")}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t("common.saving") : t("idea.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
