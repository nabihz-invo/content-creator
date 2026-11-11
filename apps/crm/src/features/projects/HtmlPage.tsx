import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useSignedUrls } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import type { ImportedMediaRow } from "@/types/db";
import { SandboxedPreview } from "./creative/SandboxedPreview";

/** A page's pointers at its shared files (P5-T25): @@asset:<brand-assets path>@@. */
const TOKEN = /@@asset:([^@\s"'()<>]+)@@/g;

export const isHtml = (m: Pick<ImportedMediaRow, "kind" | "mime_type">) =>
  m.kind === "html" || m.mime_type === "text/html";

/**
 * One HTML page of a post, ready to show: the stored page with its asset tokens swapped for signed
 * URLs (the brand-assets files are readable by the brand's members). The page text is cached; the
 * signed URLs last an hour and are refreshed with the query.
 */
export function useHtmlPage(row: ImportedMediaRow | undefined, enabled = true) {
  const path = row?.storage_path ?? undefined;
  const assets = row?.metadata.assets ?? [];
  const urls = useSignedUrls(enabled && path ? assets : [], "brand-assets");
  const page = useQuery({
    queryKey: ["html-page", path],
    enabled: enabled && !!path,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("media").download(path!);
      if (error) throw error;
      return data.text();
    },
  });
  const srcDoc = useMemo(() => {
    if (!page.data || (assets.length > 0 && !urls.data)) return undefined;
    return page.data.replace(TOKEN, (_m, p: string) => urls.data?.[p] ?? "");
  }, [page.data, urls.data, assets.length]);
  return { srcDoc, error: page.error ?? urls.error };
}

/**
 * Shows a stored HTML page scaled to its box, in a sandboxed frame (no same-origin access).
 * `fill`: fit the parent's width and height; otherwise fit the width up to `maxHeight`.
 * `interactive` false: clicks go to whatever is behind it (cards with their own click).
 */
export function HtmlPage({
  row,
  load = true,
  fill = false,
  maxHeight,
  interactive = false,
}: {
  row: ImportedMediaRow;
  load?: boolean;
  fill?: boolean;
  maxHeight?: number;
  interactive?: boolean;
}) {
  const { t } = useI18n();
  const { srcDoc, error } = useHtmlPage(row, load);
  if (error)
    return (
      <span className="flex flex-col items-center gap-1 p-2 text-center text-xs text-muted-foreground">
        <FileText className="size-5" />
        {t("finished.htmlFailed")}
      </span>
    );
  if (!srcDoc)
    return (
      <span className="p-2 text-center text-xs text-muted-foreground" aria-live="polite">
        {t("finished.htmlLoading")}
      </span>
    );
  return (
    <SandboxedPreview
      srcDoc={srcDoc}
      width={row.width ?? 1080}
      height={row.height ?? 1350}
      fill={fill}
      maxHeight={maxHeight}
      interactive={interactive}
      title={row.file_name}
    />
  );
}
