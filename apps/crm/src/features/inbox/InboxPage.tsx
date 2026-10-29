import { OVERVIEW_GROUPS } from "@cc/shared";
import { ChevronLeft, ChevronRight, Copy, Link2, Plus, Search, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelative, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import {
  PAGE_SIZE,
  type ProjectFilters,
  type ProjectListRow,
  useBrands,
  useProjects,
  useTags,
} from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";
import type { InputSource } from "@/types/db";
import { CsvImportDialog } from "./CsvImportDialog";
import { NewIdeaDialog } from "./NewIdeaDialog";

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

export function InboxPage() {
  const { t, locale } = useI18n();
  const { workspaceId, can } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const debounced = useDebounced(search);

  const filters: ProjectFilters = {
    search: debounced,
    statusGroup: (params.get("group") as Group | null) ?? "",
    source: (params.get("source") as InputSource | null) ?? "",
    brandId: params.get("brand") ?? undefined,
    tagId: params.get("tag") ?? undefined,
    page: Number(params.get("page") ?? 0),
  };
  const projects = useProjects(workspaceId, filters);
  const brands = useBrands(workspaceId);
  const tags = useTags(workspaceId);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  }

  useEffect(() => {
    if ((params.get("q") ?? "") !== debounced) setParam("q", debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const total = projects.data?.count ?? 0;
  const page = filters.page ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(
    debounced || filters.statusGroup || filters.source || filters.brandId || filters.tagId,
  );

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

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)]">
        <div className="relative sm:col-span-2 lg:col-span-1">
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
        <NativeSelect
          aria-label={t("inbox.filter.status")}
          value={filters.statusGroup}
          onChange={(e) => setParam("group", e.target.value)}
        >
          <option value="">
            {t("inbox.filter.status")}: {t("common.all")}
          </option>
          {(Object.keys(OVERVIEW_GROUPS) as Group[]).map((g) => (
            <option key={g} value={g}>
              {t(`overview.group.${g}` as MessageKey)}
            </option>
          ))}
        </NativeSelect>
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

      {projects.isError ? (
        <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />
      ) : projects.isLoading ? (
        <ListSkeleton rows={8} />
      ) : !projects.data?.rows.length ? (
        <EmptyState message={hasFilters ? t("inbox.empty") : t("inbox.emptyAll")} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">{t("inbox.col.idea")}</TableHead>
                  <TableHead>{t("inbox.col.source")}</TableHead>
                  <TableHead>{t("inbox.col.brand")}</TableHead>
                  <TableHead>{t("inbox.col.status")}</TableHead>
                  <TableHead>{t("inbox.col.submitted")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.data.rows.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer">
                    <TableCell className="max-w-0">
                      <IdeaCell project={p} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t(`source.${p.input_source}`)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.brands?.name ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      {formatRelative(p.submitted_at, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-2 md:hidden">
            {projects.data.rows.map((p) => (
              <li key={p.id} className="rounded-xl border bg-card p-4">
                <IdeaCell project={p} />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={p.status} />
                  <span>{t(`source.${p.input_source}`)}</span>
                  {p.brands?.name && <span>· {p.brands.name}</span>}
                  <span>· {formatRelative(p.submitted_at, locale)}</span>
                </div>
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

function IdeaCell({ project: p }: { project: ProjectListRow }) {
  const { t } = useI18n();
  return (
    <Link
      to={`/projects/${p.id}`}
      className="block min-w-0 after:absolute after:inset-0 md:relative md:after:hidden"
    >
      <div className="flex items-center gap-2">
        <span className="truncate font-medium" dir={textDir(p.title)}>
          {p.title}
        </span>
        {p.duplicate_of && (
          <Badge variant="warning" className="shrink-0">
            <Copy />
            {t("inbox.duplicate")}
          </Badge>
        )}
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
        {p.source_url && <Link2 className="size-3 shrink-0" />}
        <span className="truncate" dir={textDir(p.original_idea)}>
          {p.original_idea !== p.title ? p.original_idea : (p.source_url ?? "")}
        </span>
      </div>
      {p.project_tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {p.project_tags.map(({ tags: tag }) => (
            <span
              key={tag.id}
              className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
