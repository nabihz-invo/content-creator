import { sha256Hex } from "@cc/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, ImageOff, ImagePlus, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageLightbox } from "@/components/ImageLightbox";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes, textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import {
  type LibraryFile,
  type LibraryItem,
  type LibraryKind,
  type LibraryStatus,
  useBrands,
  useLibrary,
  useSignedUrls,
} from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";

type Entry = LibraryItem & { files: LibraryFile[] };

const KINDS: LibraryKind[] = ["background", "graphic", "post_image"];
const STATUSES: LibraryStatus[] = ["to_generate", "generated", "approved", "ready", "retired"];
const PREFIX: Record<LibraryKind, string> = { background: "BG", graphic: "GFX", post_image: "PI" };
// Post images also take scene (SC), concept (OB), seasonal (SE), device frame (UI) and presenter (PR) codes (P5-T22).
const PREFIXES: Record<LibraryKind, string[]> = {
  background: ["BG"],
  graphic: ["GFX"],
  post_image: ["PI", "SC", "OB", "SE", "UI", "PR"],
};
const STATUS_VARIANT = {
  to_generate: "warning",
  generated: "info",
  approved: "success",
  ready: "success",
  retired: "outline",
} as const;

/** The text fields of an entry, in the order they are shown and edited. */
const FIELDS = [
  "use_for",
  "when_to_use",
  "fits_posts",
  "placeholders",
  "story",
  "text_space",
  "on_image_text",
  "reference",
  "notes",
] as const;
type Field = (typeof FIELDS)[number];

/** Where an uploaded file lives in the library (what creatives reference as /assets/<path>). */
function libraryPath(e: Entry, variant: "final" | "raw", file: File) {
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "png").toLowerCase();
  if (e.kind === "graphic") {
    const rest = file.name
      .replace(/\.[^.]+$/, "")
      .replace(new RegExp(`^${e.code}[_-]?`, "i"), "")
      .replace(/[^\w-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `graphics/${variant === "raw" ? "raw/" : ""}${e.code}${rest ? `_${rest}` : ""}.${ext}`;
  }
  const folder = e.kind === "background" ? "backgrounds" : "post-images";
  return `${folder}/${variant}/${e.code}.${ext}`;
}

const isImage = (f: LibraryFile) => (f.mime_type ?? "").startsWith("image/");

/**
 * Visual library (P5-T21): every background, graphic and post image with its file(s), how and
 * where to use it, the prompt that makes it, and its status. New entries start as a prompt; the
 * image is generated outside and uploaded here. Agents read the same entries (scripts/library).
 */
export function VisualLibraryPage() {
  const { t } = useI18n();
  const { workspaceId, can } = useWorkspace();
  const brands = useBrands(workspaceId);
  const [brandPick, setBrandPick] = useState<string>("");
  const brandId = brandPick || brands.data?.[0]?.id;
  const lib = useLibrary(brandId);
  const [kind, setKind] = useState<LibraryKind | "all">("all");
  const [status, setStatus] = useState<LibraryStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ entry?: Entry } | null>(null);

  const all = useMemo(() => (lib.data ?? []) as Entry[], [lib.data]);
  const q = search.trim().toLowerCase();
  const rows = all.filter(
    (e) =>
      (kind === "all" || e.kind === kind) &&
      (status === "all" || e.status === status) &&
      (!q ||
        [e.code, e.title, e.collection, e.use_for, e.when_to_use, e.fits_posts, e.prompt]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q))),
  );
  const count = (k: LibraryKind | "all") => all.filter((e) => k === "all" || e.kind === k).length;
  // Thumbnails: the first final image of each entry in view.
  const thumbs = rows.flatMap((e) => {
    const f = e.files.find((x) => x.metadata.variant !== "raw" && isImage(x)) ?? e.files[0];
    return f ? [f.storage_path] : [];
  });
  const urls = useSignedUrls(thumbs, "brand-assets");
  const open = all.find((e) => e.id === openId) ?? null;

  return (
    <>
      <PageHeader
        title={t("nav.visuals")}
        subtitle={t("visuals.subtitle")}
        actions={
          can("edit") && brandId ? (
            <Button onClick={() => setForm({})}>
              <Plus />
              {t("visuals.new")}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {(["all", ...KINDS] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              role="tab"
              aria-selected={kind === k}
              variant={kind === k ? "secondary" : "ghost"}
              onClick={() => setKind(k)}
            >
              {t(`visuals.kind.${k}`)}
              <span className="text-muted-foreground tabular-nums">{count(k)}</span>
            </Button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <Input
            placeholder={t("visuals.search")}
            aria-label={t("visuals.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <NativeSelect
            aria-label={t("visuals.status")}
            value={status}
            onChange={(e) => setStatus(e.target.value as LibraryStatus | "all")}
          >
            <option value="all">{t("visuals.allStatuses")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`visuals.status.${s}`)}
              </option>
            ))}
          </NativeSelect>
          {(brands.data?.length ?? 0) > 1 && (
            <NativeSelect
              aria-label={t("nav.brands")}
              value={brandId ?? ""}
              onChange={(e) => setBrandPick(e.target.value)}
            >
              {brands.data!.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </div>
      </div>

      {lib.isLoading || brands.isLoading ? (
        <ListSkeleton rows={4} />
      ) : lib.isError ? (
        <ErrorState error={lib.error} onRetry={() => void lib.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<ImagePlus className="size-5" />} message={t("visuals.empty")} />
      ) : (
        <ul
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          data-testid="visuals-grid"
        >
          {rows.map((e) => {
            const f = e.files.find((x) => x.metadata.variant !== "raw" && isImage(x)) ?? e.files[0];
            const src = f ? urls.data?.[f.storage_path] : undefined;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(e.id)}
                  className="flex w-full flex-col overflow-hidden rounded-xl border bg-card text-start shadow-xs transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    {src && f && isImage(f) ? (
                      <img
                        src={src}
                        alt={e.code}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                        <ImageOff className="size-5" />
                        {e.files.length ? "" : t("visuals.noImage")}
                      </span>
                    )}
                    <Badge
                      variant={STATUS_VARIANT[e.status]}
                      className="absolute end-2 top-2 bg-card/90 shadow-xs"
                    >
                      {t(`visuals.status.${e.status}`)}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground" dir="ltr">
                        {e.code}
                      </span>
                      {e.aspect && <span dir="ltr">{e.aspect}</span>}
                      {e.collection && <span className="truncate">· {e.collection}</span>}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium" dir={textDir(e.title)}>
                      {e.title}
                    </p>
                    {e.use_for && (
                      <p
                        className="line-clamp-2 text-xs text-muted-foreground"
                        dir={textDir(e.use_for)}
                      >
                        {e.use_for}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <EntryDialog
          entry={open}
          onClose={() => setOpenId(null)}
          onEdit={() => setForm({ entry: open })}
        />
      )}
      {form && brandId && (
        <EntryForm
          brandId={brandId}
          entry={form.entry}
          taken={new Set(all.map((e) => e.code))}
          onClose={() => setForm(null)}
          onSaved={(id) => {
            setForm(null);
            setOpenId(id);
          }}
        />
      )}
    </>
  );
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void navigator.clipboard.writeText(text).then(() => toast.success(t("common.copied")))
          }
        >
          <Copy />
          {t("common.copy")}
        </Button>
      </div>
      <pre
        className="max-h-60 overflow-auto rounded-lg bg-muted/60 p-3 text-xs leading-relaxed whitespace-pre-wrap"
        dir={textDir(text)}
      >
        {text}
      </pre>
    </div>
  );
}

function EntryDialog({
  entry: e,
  onClose,
  onEdit,
}: {
  entry: Entry;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { t, dir } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
  const urls = useSignedUrls(
    e.files.map((f) => f.storage_path),
    "brand-assets",
  );
  const images = e.files.filter(isImage);
  const [view, setView] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [variant, setVariant] = useState<"final" | "raw">("final");
  const [inputKey, setInputKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["library"] });

  const setStatus = useMutation({
    mutationFn: async (status: LibraryStatus) => {
      const { error } = await supabase.from("library_items").update({ status }).eq("id", e.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("visuals.saved"));
      refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const upload = useMutation({
    mutationFn: async () => {
      const f = file!;
      const path = libraryPath(e, variant, f);
      const checksum = await sha256Hex(new Uint8Array(await f.arrayBuffer()));
      const version = 1 + Math.max(0, ...e.files.map((x) => x.version));
      const storagePath = `${e.brand_id}/${e.kind}/v${version}/${path}`;
      const up = await supabase.storage
        .from("brand-assets")
        .upload(storagePath, f, { contentType: f.type || undefined, upsert: false });
      if (up.error) throw up.error;
      const { error } = await supabase.rpc("attach_library_file", {
        p_item_id: e.id,
        p_variant: variant,
        p_library_path: path,
        p_storage_path: storagePath,
        p_mime_type: f.type || null,
        p_file_size: f.size,
        p_checksum: checksum,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("visuals.uploaded"));
      setFile(null);
      setInputKey((k) => k + 1);
      refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeFile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("delete_library_file", { p_asset_id: id });
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (err) => toast.error(err.message),
  });

  const removeEntry = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("delete_library_item", { p_item_id: e.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("visuals.deleted", { code: e.code }));
      onClose();
      refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir={dir} closeLabel={t("common.close")} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pe-8">
            <span dir="ltr">{e.code}</span>
            <span className="font-normal" dir={textDir(e.title)}>
              {e.title}
            </span>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant={STATUS_VARIANT[e.status]}>{t(`visuals.status.${e.status}`)}</Badge>
            <Badge variant="secondary">{t(`visuals.kind.${e.kind}`)}</Badge>
            {e.collection && <Badge variant="outline">{e.collection}</Badge>}
            {e.pillar && <Badge variant="outline">{e.pillar}</Badge>}
            {e.aspect && (
              <Badge variant="outline" dir="ltr">
                {e.aspect}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Files */}
        {e.files.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {e.files.map((f) => {
              const src = urls.data?.[f.storage_path];
              const i = images.indexOf(f);
              return (
                <figure key={f.id} className="group relative w-44 shrink-0">
                  <button
                    type="button"
                    className="block aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    onClick={() => i >= 0 && setView(i)}
                    aria-label={t("visuals.viewFile", { file: f.name })}
                  >
                    {src && isImage(f) ? (
                      <img src={src} alt={f.name} className="size-full object-cover" />
                    ) : (
                      <ImageOff className="m-auto size-5 text-muted-foreground" />
                    )}
                  </button>
                  <figcaption className="mt-1 flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
                    <span className="truncate" dir="ltr">
                      {f.metadata.variant === "raw" ? `${t("visuals.raw")} · ` : ""}
                      {f.name} · {formatBytes(f.file_size)}
                    </span>
                  </figcaption>
                  {can("edit") && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute end-1.5 top-1.5 size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label={t("visuals.deleteFile", { file: f.name })}
                      onClick={() => removeFile.mutate(f.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </figure>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t("visuals.noFileYet")}
          </p>
        )}

        {/* Upload (storage writes are for workspace admins) */}
        {can("admin") && (
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <Label htmlFor="visual-file">{t("visuals.upload")}</Label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
              <Input
                key={inputKey}
                id="visual-file"
                type="file"
                accept="image/*"
                onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
              />
              <NativeSelect
                aria-label={t("visuals.variant")}
                value={variant}
                onChange={(ev) => setVariant(ev.target.value as "final" | "raw")}
              >
                <option value="final">{t("visuals.variant.final")}</option>
                <option value="raw">{t("visuals.variant.raw")}</option>
              </NativeSelect>
              <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
                <Upload />
                {upload.isPending ? t("common.saving") : t("visuals.uploadButton")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("visuals.uploadHelp")}</p>
          </div>
        )}

        {/* How, where and when */}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {FIELDS.map((k) =>
            e[k] ? (
              <div key={k} className={cn(k === "when_to_use" && "sm:col-span-2")}>
                <dt className="text-xs font-semibold text-muted-foreground">
                  {t(`visuals.field.${k}`)}
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap" dir={textDir(e[k])}>
                  {e[k]}
                </dd>
              </div>
            ) : null,
          )}
        </dl>

        {e.prompt && <CopyBlock label={t("visuals.field.prompt")} text={e.prompt} />}
        {e.negative_prompt && (
          <CopyBlock label={t("visuals.field.negative_prompt")} text={e.negative_prompt} />
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            {can("admin") && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 />
                {t("visuals.delete")}
              </Button>
            )}
          </div>
          {can("edit") && (
            <div className="flex flex-wrap items-center gap-2">
              <NativeSelect
                aria-label={t("visuals.status")}
                value={e.status}
                disabled={setStatus.isPending}
                onChange={(ev) => setStatus.mutate(ev.target.value as LibraryStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`visuals.status.${s}`)}
                  </option>
                ))}
              </NativeSelect>
              <Button variant="outline" onClick={onEdit}>
                <Pencil />
                {t("common.edit")}
              </Button>
            </div>
          )}
        </DialogFooter>

        <ImageLightbox
          items={images.map((f) => ({ src: urls.data?.[f.storage_path] ?? "", title: f.name }))}
          index={view}
          onIndex={setView}
          onClose={() => setView(null)}
        />

        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent dir={dir} closeLabel={t("common.close")}>
            <DialogHeader>
              <DialogTitle>{t("visuals.deleteTitle", { code: e.code })}</DialogTitle>
              <DialogDescription>
                {t("visuals.deleteBody", { n: e.files.length })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                disabled={removeEntry.isPending}
                onClick={() => removeEntry.mutate()}
              >
                <Trash2 />
                {t("visuals.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function nextCode(kind: LibraryKind, taken: Set<string>) {
  const p = PREFIX[kind];
  const used = [...taken]
    .filter((c) => c.startsWith(`${p}-`))
    .map((c) => Number(c.slice(p.length + 1)));
  const n = Math.max(0, ...used) + 1;
  return `${p}-${String(n).padStart(2, "0")}`;
}

function EntryForm({
  brandId,
  entry,
  taken,
  onClose,
  onSaved,
}: {
  brandId: string;
  entry?: Entry;
  taken: Set<string>;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { t, dir } = useI18n();
  const qc = useQueryClient();
  const [kind, setKind] = useState<LibraryKind>(entry?.kind ?? "background");
  const [code, setCode] = useState(entry?.code ?? nextCode("background", taken));
  const [v, setV] = useState({
    title: entry?.title ?? "",
    status: entry?.status ?? ("to_generate" as LibraryStatus),
    collection: entry?.collection ?? "",
    pillar: entry?.pillar ?? "",
    aspect: entry?.aspect ?? "",
    prompt: entry?.prompt ?? "",
    negative_prompt: entry?.negative_prompt ?? "",
    ...Object.fromEntries(FIELDS.map((k) => [k, entry?.[k] ?? ""])),
  } as Record<string, string>);
  const set = (k: string) => (ev: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: ev.target.value }));
  const codeOk =
    new RegExp(`^(${PREFIXES[kind].join("|")})-\\d{2,3}$`).test(code) &&
    (!!entry || !taken.has(code));

  const save = useMutation({
    mutationFn: async () => {
      const row = Object.fromEntries(
        Object.entries(v).map(([k, x]) => [k, k === "status" ? x : x.trim() || null]),
      );
      if (entry) {
        const { error } = await supabase.from("library_items").update(row).eq("id", entry.id);
        if (error) throw error;
        return entry.id;
      }
      const { data, error } = await supabase
        .from("library_items")
        .insert({ ...row, brand_id: brandId, code, kind })
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: (id) => {
      toast.success(t("visuals.saved"));
      void qc.invalidateQueries({ queryKey: ["library"] });
      onSaved(id);
    },
    onError: (err) => toast.error(err.message),
  });

  const field = (k: string, label: MessageKey, rows = 2) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`vf-${k}`}>{t(label)}</Label>
      <Textarea id={`vf-${k}`} rows={rows} value={v[k]} onChange={set(k)} dir={textDir(v[k])} />
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir={dir} closeLabel={t("common.close")} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {entry ? t("visuals.editTitle", { code: entry.code }) : t("visuals.new")}
          </DialogTitle>
          <DialogDescription>{t("visuals.formHelp")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (codeOk && v.title!.trim()) save.mutate();
          }}
        >
          {!entry && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vf-kind">{t("visuals.kindLabel")}</Label>
                <NativeSelect
                  id="vf-kind"
                  value={kind}
                  onChange={(ev) => {
                    const k = ev.target.value as LibraryKind;
                    setKind(k);
                    setCode(nextCode(k, taken));
                  }}
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(`visuals.kind.${k}`)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vf-code">{t("visuals.code")}</Label>
                <Input
                  id="vf-code"
                  dir="ltr"
                  value={code}
                  onChange={(ev) => setCode(ev.target.value.toUpperCase())}
                  aria-invalid={!codeOk}
                />
                {!codeOk && <p className="text-xs text-destructive">{t("visuals.codeInvalid")}</p>}
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vf-title">{t("visuals.field.title")}</Label>
              <Input id="vf-title" value={v.title} onChange={set("title")} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vf-status">{t("visuals.status")}</Label>
              <NativeSelect id="vf-status" value={v.status} onChange={set("status")}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`visuals.status.${s}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vf-collection">{t("visuals.field.collection")}</Label>
              <Input id="vf-collection" value={v.collection} onChange={set("collection")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vf-aspect">{t("visuals.field.aspect")}</Label>
              <Input
                id="vf-aspect"
                dir="ltr"
                placeholder="16:9 · 4:5"
                value={v.aspect}
                onChange={set("aspect")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vf-pillar">{t("visuals.field.pillar")}</Label>
              <Input id="vf-pillar" value={v.pillar} onChange={set("pillar")} />
            </div>
          </div>
          {field("prompt", "visuals.field.prompt", 6)}
          {field("negative_prompt", "visuals.field.negative_prompt")}
          {FIELDS.map((k: Field) => (
            <div key={k}>{field(k, `visuals.field.${k}`)}</div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!codeOk || !v.title!.trim() || save.isPending}>
              {save.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
