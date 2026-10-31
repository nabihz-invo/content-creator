import { checkPublishPackage, PLATFORM_RULES, PLATFORMS, type Platform } from "@cc/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Lock,
  Package,
  Send,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useApprovals, usePublishingJobs, useRenderJobs, useScripts } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";
import type { ContentProject } from "@/types/db";

export function PublishingPanel({ project }: { project: ContentProject }) {
  const { t, locale } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
  const approvals = useApprovals(project.id);
  const renders = useRenderJobs(project.id);
  const scripts = useScripts(project.id);
  const packages = usePublishingJobs(project.id);

  // The package always uses the latest approved media manifest whose render is still current.
  const approval = (approvals.data ?? []).find(
    (a) => a.stage === "media" && a.decision === "approved",
  );
  const render = (renders.data ?? []).find(
    (r) => r.id === approval?.artifact_id && r.status === "succeeded",
  );
  const script = (scripts.data ?? []).find((s) => s.status === "approved");

  const [platform, setPlatform] = useState<Platform>("instagram");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [link, setLink] = useState("");
  const [draftKey, setDraftKey] = useState(() => crypto.randomUUID());
  const [posting, setPosting] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState("");

  const prefilled = useRef(false);
  useEffect(() => {
    if (script && !prefilled.current) {
      prefilled.current = true;
      setCaption(script.content.caption ?? "");
      setTags(
        (script.content.hashtags ?? []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "),
      );
    }
  }, [script]);

  const hashtags = useMemo(() => tags.split(/\s+/).filter(Boolean), [tags]);
  const issues = useMemo(
    () =>
      render?.manifest
        ? checkPublishPackage({
            platform,
            output_type: render.output_type,
            items: render.media_assets
              .filter((a) => a.asset_type === "png" || a.asset_type === "carousel_slide")
              .map((a) => ({
                width: a.width ?? 0,
                height: a.height ?? 0,
                mime_type: a.mime_type,
                file_size: a.file_size,
              })),
            caption,
            hashtags,
            link: link.trim() || null,
          })
        : [],
    [render, platform, caption, hashtags, link],
  );

  const refresh = () => {
    for (const key of ["project", "publishing", "project-events", "status-counts"])
      void qc.invalidateQueries({ queryKey: [key] });
  };
  const create = useMutation({
    mutationFn: () =>
      api.createPublishingJob(
        {
          project_id: project.id,
          approval_id: approval!.id,
          platform,
          caption,
          hashtags,
          link: link.trim() || null,
        },
        draftKey,
      ),
    onSuccess: () => {
      toast.success(t("publish.created"));
      setDraftKey(crypto.randomUUID());
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const download = useMutation({
    mutationFn: async (id: string) => {
      const { blob, filename } = await api.downloadBundle(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    },
    onError: (e) => toast.error(e.message),
  });
  const markPosted = useMutation({
    mutationFn: () => api.markPublished(posting!, postUrl.trim()),
    onSuccess: () => {
      toast.success(t("publish.postedToast"));
      setPosting(null);
      setPostUrl("");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!approval || !render || !["ready_to_publish", "published"].includes(project.status))
    return (
      <Card>
        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <Lock className="size-4" />
          {t("publish.locked")}
        </CardContent>
      </Card>
    );

  return (
    <div className="flex flex-col gap-4" data-testid="publishing-panel">
      {can("edit") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("publish.title")}</CardTitle>
            <CardDescription>{t("publish.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pub-platform">{t("publish.platform")}</Label>
                <NativeSelect
                  id="pub-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_RULES[p].label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pub-caption">{t("publish.caption")}</Label>
                <Textarea
                  id="pub-caption"
                  rows={5}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  dir="auto"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pub-tags">{t("publish.hashtags")}</Label>
                <Input
                  id="pub-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  dir="auto"
                  placeholder={t("publish.hashtagsHint")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pub-link">{t("publish.link")}</Label>
                <Input
                  id="pub-link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  dir="ltr"
                  placeholder="https://"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium">{t("publish.checks")}</div>
              {issues.length === 0 ? (
                <div
                  className="flex items-start gap-2 text-sm text-success"
                  data-testid="publish-checks-ok"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  {t("publish.checksOk", { platform: PLATFORM_RULES[platform].label })}
                </div>
              ) : (
                <ul
                  className="flex flex-col gap-1.5 text-sm text-destructive"
                  data-testid="publish-issues"
                >
                  {issues.map((i) => (
                    <li key={i.message} className="flex items-start gap-2" dir="ltr">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                      {i.message}
                    </li>
                  ))}
                </ul>
              )}
              <Button
                onClick={() => create.mutate()}
                disabled={issues.length > 0 || create.isPending}
                className="mt-auto"
              >
                {create.isPending ? <Loader2 className="animate-spin" /> : <Package />}
                {t("publish.create")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("publish.bundleContents")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("publish.packages")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!packages.data?.length ? (
            <p className="text-sm text-muted-foreground">{t("publish.noPackages")}</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {packages.data.map((pj) => (
                <li
                  key={pj.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                  data-testid="publishing-job"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      {PLATFORM_RULES[pj.platform as Platform]?.label ?? pj.platform}
                      <Badge variant={pj.status === "published" ? "success" : "info"}>
                        {t(`publish.status.${pj.status}` as MessageKey)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(pj.published_at ?? pj.created_at, locale)} ·{" "}
                      <span className="font-mono" dir="ltr">
                        {pj.manifest_hash.slice(0, 12)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => download.mutate(pj.id)}
                    disabled={download.isPending}
                  >
                    <Download />
                    {t("publish.download")}
                  </Button>
                  {pj.status === "ready" && can("edit") && (
                    <Button size="sm" onClick={() => setPosting(pj.id)}>
                      <Send />
                      {t("publish.markPosted")}
                    </Button>
                  )}
                  {pj.published_url && (
                    <a
                      href={pj.published_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {t("publish.viewPost")}
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!posting} onOpenChange={(o) => !o && setPosting(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("publish.postedTitle")}</DialogTitle>
            <DialogDescription>{t("publish.postedBody")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="post-url">{t("publish.postUrl")}</Label>
            <Input
              id="post-url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              dir="ltr"
              placeholder="https://"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPosting(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => markPosted.mutate()}
              disabled={!/^https:\/\/\S+$/.test(postUrl.trim()) || markPosted.isPending}
            >
              {t("publish.markPosted")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
