import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Copy, FileSpreadsheet } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type CsvImportResult } from "@/lib/api";
import { textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useBrands } from "@/lib/queries";
import { useWorkspace } from "@/lib/workspace";
import { CSV_FIELDS, type CsvField, decodeCsvBytes, guessMapping, previewCsv } from "./csv-mapping";

export function CsvImportDialog({ children }: { children: ReactNode }) {
  const { t, dir } = useI18n();
  const { workspaceId } = useWorkspace();
  const brands = useBrands(workspaceId);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<CsvField, string>>>({});
  const [brandId, setBrandId] = useState("");
  const [checked, setChecked] = useState<CsvImportResult | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const mappingValid = Boolean(mapping.idea || mapping.url);
  const cleanMapping = useMemo(
    () =>
      Object.fromEntries(Object.entries(mapping).filter(([, v]) => v)) as Record<string, string>,
    [mapping],
  );

  function reset() {
    setFile(null);
    setPreview(null);
    setMapping({});
    setBrandId("");
    setChecked(null);
    setResult(null);
    setFileError(null);
  }

  async function onFile(f: File | undefined) {
    reset();
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setFileError("> 5 MB");
      return;
    }
    const text = decodeCsvBytes(await f.arrayBuffer());
    const p = previewCsv(text);
    setFile(f);
    setPreview(p);
    setMapping(guessMapping(p.headers));
  }

  const run = useMutation({
    mutationFn: (dryRun: boolean) =>
      api.importCsv({
        file: file!,
        mapping: cleanMapping,
        workspaceId: workspaceId ?? undefined,
        brandId: brandId || undefined,
        dryRun,
      }),
    onSuccess: (r) => {
      if (r.dry_run) {
        setChecked(r);
      } else {
        setResult(r);
        void qc.invalidateQueries({ queryKey: ["projects"] });
        void qc.invalidateQueries({ queryKey: ["status-counts"] });
      }
    },
  });

  const report = result ?? checked;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent dir={dir} className="sm:max-w-3xl" closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("csv.title")}</DialogTitle>
          <DialogDescription>{t("csv.description")}</DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="csv-file">{t("csv.file")}</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              <p className="text-xs text-muted-foreground">{t("csv.fileHint")}</p>
              {fileError && <p className="text-sm text-destructive">{fileError}</p>}
            </div>

            {preview && (
              <>
                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-2 text-sm font-medium">{t("csv.mapping")}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CSV_FIELDS.map((field) => (
                      <div key={field} className="flex flex-col gap-1.5">
                        <Label htmlFor={`map-${field}`} className="text-xs text-muted-foreground">
                          {t(`csv.field.${field}` as MessageKey)}
                        </Label>
                        <NativeSelect
                          id={`map-${field}`}
                          value={mapping[field] ?? ""}
                          onChange={(e) => {
                            setChecked(null);
                            setMapping((m) => ({ ...m, [field]: e.target.value || undefined }));
                          }}
                        >
                          <option value="">{t("csv.notMapped")}</option>
                          {preview.headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                    ))}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="csv-brand" className="text-xs text-muted-foreground">
                        {t("csv.defaultBrand")}
                      </Label>
                      <NativeSelect
                        id="csv-brand"
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
                  </div>
                  {!mappingValid && (
                    <p className="text-sm text-destructive">{t("csv.needIdeaOrUrl")}</p>
                  )}
                </fieldset>

                <div>
                  <div className="mb-2 text-sm font-medium">
                    {t("csv.preview", { n: preview.rows.length })}
                  </div>
                  <div className="max-h-48 overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {preview.headers.map((h) => (
                            <TableHead key={h}>{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.rows.map((r, i) => (
                          <TableRow key={i}>
                            {preview.headers.map((h, j) => (
                              <TableCell key={h} className="max-w-56 truncate" dir={textDir(r[j])}>
                                {r[j]}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {run.error && (
          <p role="alert" className="text-sm text-destructive">
            {run.error.message}
          </p>
        )}

        {report && <ImportReport result={report} />}

        <DialogFooter>
          {result ? (
            <Button onClick={() => setOpen(false)}>{t("csv.done")}</Button>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={!file || !mappingValid || run.isPending}
                onClick={() => run.mutate(true)}
              >
                <FileSpreadsheet />
                {t("csv.validate")}
              </Button>
              <Button
                disabled={!file || !mappingValid || run.isPending}
                onClick={() => run.mutate(false)}
              >
                {run.isPending
                  ? t("csv.importing")
                  : checked
                    ? t("csv.import", { n: checked.totals.valid })
                    : t("csv.importNow")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportReport({ result }: { result: CsvImportResult }) {
  const { t } = useI18n();
  const problems = result.rows.filter((r) => r.status === "failed" || r.status === "duplicate");
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4" aria-live="polite">
      <div className="font-medium">{result.dry_run ? t("csv.validate") : t("csv.result")}</div>
      <div className="flex flex-wrap gap-2 text-sm">
        {result.dry_run ? (
          <Badge variant="success">
            <CheckCircle2 /> {t("csv.totals.valid")}: {result.totals.valid}
          </Badge>
        ) : (
          <Badge variant="success">
            <CheckCircle2 /> {t("csv.totals.created")}: {result.totals.created}
          </Badge>
        )}
        <Badge variant="warning">
          <Copy /> {t("csv.totals.duplicate")}: {result.totals.duplicate}
        </Badge>
        <Badge variant="destructive">
          <CircleAlert /> {t("csv.totals.failed")}: {result.totals.failed}
        </Badge>
      </div>
      {problems.length > 0 && (
        <ul className="max-h-40 overflow-auto text-sm">
          {problems.map((r) => (
            <li key={r.row} className="flex gap-2 border-t py-1.5 first:border-0">
              <span className="w-16 shrink-0 text-muted-foreground">
                {t("csv.row", { n: r.row })}
              </span>
              {r.status === "duplicate" ? (
                <Link
                  to={`/projects/${r.duplicate_of ?? r.project_id}`}
                  className="text-primary hover:underline"
                >
                  {t("inbox.duplicate")}
                </Link>
              ) : (
                <span className="text-destructive">{r.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
