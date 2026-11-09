import { OVERVIEW_GROUPS } from "@cc/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Film,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Lightbulb,
  Link2,
  Plus,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { api } from "@/lib/api";
import { formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import {
  PAGE_SIZE,
  type ProjectFilters,
  type ProjectListRow,
  useBrands,
  useCardImages,
  useProjects,
  useSignedUrls,
  useTags,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import type { InputSource } from "@/types/db";
import { CsvImportDialog } from "./CsvImportDialog";
import { NewIdeaDialog } from "./NewIdeaDialog";
import { StageBadge, StageCards, StageHeading } from "./StageCards";
import { parseInboxStage } from "./stages";

const SOURCES: InputSource[] = ["manual", "telegram", "csv", "url"];
type Group = keyof typeof OVERVIEW_GROUPS;

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function useSetParam() {
  const [params, setParams] = useSearchParams();
  return (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };
}

function parseGroup(value: string | null): Group | "" {
  return value && value in OVERVIEW_GROUPS ? value : "";
}

/** Stage cards first; the ideas of a stage (or a search) load only once it is opened. */
export function InboxPage() {
  const { t } = useI18n();
  const { can } = useWorkspace();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const debounced = useDebounced(search);
  const setParam = useSetParam();

  const stage = parseInboxStage(params.get("stage"));
  const group = parseGroup(params.get("group"));
  const showList = Boolean(stage || group || debounced.trim());

  useEffect(() => {
    if ((params.get("q") ?? "") !== debounced) setParam("q", debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <>
      <PageHeader
        title={t("inbox.title")}
        subtitle={t("inbox.subtitle")}
        actions={
          can("edit") && (
            <>
              <CsvImportDialog>
                <Button variant="outline">
                  <Upload />
                  {t("inbox.importCsv")}
                </Button>
              </CsvImportDialog>
              <NewIdeaDialog>
                <Button>
                  <Plus />
                  {t("idea.new")}
                </Button>
              </NewIdeaDialog>
            </>
          )
        }
      />

      {showList && (
        <Button variant="ghost" size="sm" asChild className="mb-3 -ms-2">
          <Link to="/inbox" onClick={() => setSearch("")}>
            <ArrowLeft className="rtl:-scale-x-100" />
            {t("inbox.allStages")}
          </Link>
        </Button>
      )}

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          className="ps-9"
          placeholder={t("inbox.searchPlaceholder")}
          aria-label={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showList ? <IdeaList key={stage ?? group ?? "search"} search={debounced} /> : <StageCards />}
    </>
  );
}

function IdeaList({ search }: { search: string }) {
  const { t } = useI18n();
  const { workspaceId, can } = useWorkspace();
  const [params] = useSearchParams();
  const setParam = useSetParam();
  const stage = parseInboxStage(params.get("stage"));
  const group = parseGroup(params.get("group"));

  const filters: ProjectFilters = {
    search,
    statusGroup: group,
    stage,
    source: (params.get("source") as InputSource | null) ?? "",
    contentType: (params.get("type") as ContentType | null) ?? "",
    brandId: params.get("brand") ?? undefined,
    tagId: params.get("tag") ?? undefined,
    page: Number(params.get("page") ?? 0),
  };
  const projects = useProjects(workspaceId, filters);
  const images = useCardImages((projects.data?.rows ?? []).map((p) => p.id));
  const urls = useSignedUrls(Object.values(images.data ?? {}), "media");
  const brands = useBrands(workspaceId);
  const tags = useTags(workspaceId);

  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const analyzable = (p: ProjectListRow) => p.inbox_stage === "new" || p.inbox_stage === "failed";
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const analyze = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => api.analyze(id)));
      const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      if (failed.length) throw new Error(failed.map((f) => (f.reason as Error).message).join("; "));
      return ids.length;
    },
    onSuccess: (n) => toast.success(t("inbox.analyzed", { n })),
    onError: (e) => toast.error(e.message),
    onSettled: () => {
      setSelected(new Set());
      void qc.invalidateQueries({ queryKey: ["projects"] });
      void qc.invalidateQueries({ queryKey: ["status-counts"] });
    },
  });

  const total = projects.data?.count ?? 0;
  const page = filters.page ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(
    search || filters.source || filters.contentType || filters.brandId || filters.tagId,
  );

  return (
    <>
      {stage ? (
        <StageHeading stage={stage} total={projects.data?.count} />
      ) : (
        group && (
          <h2 className="mb-4 text-lg font-semibold">
            {t(`overview.group.${group}` as MessageKey)}
          </h2>
        )
      )}

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <NativeSelect
          aria-label={t("inbox.filter.source")}
          value={filters.source}
          onChange={(e) => setParam("source", e.target.value)}
        >
          <option value="">
            {t("inbox.filter.source")}: {t("common.all")}
          </option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {t(`source.${s}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("inbox.filter.brand")}
          value={filters.brandId ?? ""}
          onChange={(e) => setParam("brand", e.target.value)}
        >
          <option value="">
            {t("inbox.filter.brand")}: {t("common.all")}
          </option>
          {brands.data?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("inbox.filter.tag")}
          value={filters.tagId ?? ""}
          onChange={(e) => setParam("tag", e.target.value)}
        >
          <option value="">
            {t("inbox.filter.tag")}: {t("common.all")}
          </option>
          {tags.data?.map((tag) => (
            <option key={tag.id} value={tag.id}>
              #{tag.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <TypeChips value={filters.contentType ?? ""} onChange={(v) => setParam("type", v)} />

      {projects.isError ? (
        <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />
      ) : projects.isLoading ? (
        <ListSkeleton rows={8} />
      ) : !projects.data?.rows.length ? (
        <EmptyState message={hasFilters ? t("inbox.empty") : t("inbox.stageEmpty")} />
      ) : (
        <>
          {selected.size > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
              <Button
                size="sm"
                onClick={() => analyze.mutate([...selected])}
                disabled={analyze.isPending}
              >
                <Sparkles />
                {t("inbox.analyzeSelected", { n: selected.size })}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                {t("common.cancel")}
              </Button>
            </div>
          )}
          <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.data.rows.map((p) => (
              <li key={p.id} className="relative">
                <ProjectCard
                  project={p}
                  image={images.data?.[p.id] ? urls.data?.[images.data[p.id]!] : undefined}
                  selected={selected.has(p.id)}
                />
                {can("edit") && analyzable(p) && (
                  <div className="absolute end-2 top-2 z-10 rounded-md bg-background/90 p-1 shadow-sm">
                    <Checkbox
                      aria-label={`${t("inbox.selectRow")}: ${p.title}`}
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggle(p.id)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("inbox.count", { n: total })}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setParam("page", String(page - 1))}
              >
                <ChevronLeft className="rtl:-scale-x-100" />
                {t("inbox.prev")}
              </Button>
              <span className="tabular-nums">
                {page + 1} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= pages}
                onClick={() => setParam("page", String(page + 1))}
              >
                {t("inbox.next")}
                <ChevronRight className="rtl:-scale-x-100" />
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

type ContentType = NonNullable<ProjectListRow["content_type"]>;

/** One colour and icon per format (brand blues: Ocean, Signal, Deep sea; grey when unknown). */
const TYPE_STYLE: Record<ContentType | "none", { color: string; Icon: typeof Film }> = {
  video: { color: "#2F86B8", Icon: Film },
  carousel: { color: "#0895A6", Icon: GalleryHorizontalEnd },
  static: { color: "#2C5974", Icon: ImageIcon },
  none: { color: "#8A9AAB", Icon: Lightbulb },
};
const TYPES: ContentType[] = ["video", "carousel", "static"];

/** A project as a card: format colour on top, the post's picture when it exists, else the format icon. */
function ProjectCard({
  project: p,
  image,
  selected,
}: {
  project: ProjectListRow;
  image: string | undefined;
  selected: boolean;
}) {
  const { t, locale } = useI18n();
  const style = TYPE_STYLE[p.content_type ?? "none"];
  const typeLabel = p.content_type ? t(`contentType.${p.content_type}`) : t("inbox.type.none");
  return (
    <Link
      to={`/projects/${p.id}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-t-4 bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected && "ring-2 ring-primary",
      )}
      style={{ borderTopColor: style.color }}
    >
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
        style={{ backgroundColor: `${style.color}1f` }}
      >
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <style.Icon className="size-12 opacity-70" style={{ color: style.color }} aria-hidden />
        )}
        <span
          className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: style.color }}
        >
          <style.Icon className="size-3" aria-hidden />
          {typeLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start gap-2">
          <span className="line-clamp-2 font-medium leading-snug" dir={textDir(p.title)}>
            {p.title}
          </span>
          {p.duplicate_of && (
            <Badge variant="warning" className="shrink-0">
              <Copy />
              {t("inbox.duplicate")}
            </Badge>
          )}
        </div>
        {(p.original_idea !== p.title || p.source_url) && (
          <p className="line-clamp-2 text-xs text-muted-foreground" dir={textDir(p.original_idea)}>
            {p.source_url && <Link2 className="me-1 inline size-3" />}
            {p.original_idea !== p.title ? p.original_idea : p.source_url}
          </p>
        )}
        {p.project_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.project_tags.slice(0, 4).map(({ tags: tag }) => (
              <span
                key={tag.id}
                className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                #{tag.name}
              </span>
            ))}
            {p.project_tags.length > 4 && (
              <span className="text-[11px] text-muted-foreground">
                +{p.project_tags.length - 4}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs text-muted-foreground">
          <StageBadge stage={p.inbox_stage} />
          {p.publish_date ? (
            <span className="inline-flex items-center gap-1" dir="ltr">
              <CalendarDays className="size-3" />
              {p.publish_date.slice(0, 10)}
            </span>
          ) : (
            <span>{formatRelative(p.submitted_at, locale)}</span>
          )}
          {p.format && <span className="truncate">· {p.format}</span>}
        </div>
      </div>
    </Link>
  );
}

/** Format filter as coloured chips. */
function TypeChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const chip = (v: string, label: string, color?: string, Icon?: typeof Film) => {
    const active = value === v;
    return (
      <button
        key={v || "all"}
        type="button"
        aria-pressed={active}
        onClick={() => onChange(v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          !active && "hover:bg-accent",
          active && !color && "border-foreground bg-foreground text-background",
        )}
        style={
          color
            ? active
              ? { backgroundColor: color, borderColor: color, color: "#fff" }
              : { borderColor: `${color}66`, color }
            : undefined
        }
      >
        {Icon && <Icon className="size-3.5" aria-hidden />}
        {label}
      </button>
    );
  };
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t("inbox.filter.type")}>
      {chip("", t("common.all"))}
      {TYPES.map((ct) =>
        chip(ct, t(`contentType.${ct}`), TYPE_STYLE[ct].color, TYPE_STYLE[ct].Icon),
      )}
    </div>
  );
}
