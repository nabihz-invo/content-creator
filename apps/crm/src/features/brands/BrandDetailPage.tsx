import { sha256Hex } from "@cc/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes, formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useBrand, useBrandAssets, useBrandHistory } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/lib/workspace";
import type { Brand, BrandAsset, BrandSettings } from "@/types/db";
import { ListField } from "./list-field";

const PLATFORMS = ["instagram", "tiktok", "linkedin", "x", "facebook", "youtube"] as const;
const ASSET_TYPES: BrandAsset["asset_type"][] = [
  "logo",
  "font",
  "reference_image",
  "template",
  "other",
];

export function BrandDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const brand = useBrand(id);
  if (brand.isLoading) return <ListSkeleton rows={6} />;
  if (brand.isError) return <ErrorState error={brand.error} onRetry={() => void brand.refetch()} />;
  if (!brand.data) return <EmptyState message={t("project.notFound")} />;
  return <BrandEditor key={`${brand.data.id}:${brand.data.settings_version}`} brand={brand.data} />;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

function BrandEditor({ brand }: { brand: Brand }) {
  const { t, dir } = useI18n();
  const { can } = useWorkspace();
  const qc = useQueryClient();
  const readOnly = !can("admin");
  const [name, setName] = useState(brand.name);
  const [description, setDescription] = useState(brand.description ?? "");
  const [language, setLanguage] = useState(brand.default_language);
  const [s, setS] = useState<BrandSettings>(brand.brand_settings ?? {});
  const dirty =
    name !== brand.name ||
    description !== (brand.description ?? "") ||
    language !== brand.default_language ||
    JSON.stringify(s) !== JSON.stringify(brand.brand_settings ?? {});

  const update = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          default_language: language,
          brand_settings: s,
        })
        .eq("id", brand.id)
        .select("settings_version")
        .single();
      if (error) throw error;
      return data.settings_version as number;
    },
    onSuccess: (v) => {
      toast.success(t("brands.saved", { n: v }));
      void qc.invalidateQueries({ queryKey: ["brand", brand.id] });
      void qc.invalidateQueries({ queryKey: ["brands"] });
      void qc.invalidateQueries({ queryKey: ["brand-history", brand.id] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-3 -ms-2">
        <Link to="/brands">
          <ArrowLeft className="rtl:-scale-x-100" />
          {t("brands.title")}
        </Link>
      </Button>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{brand.name}</h1>
          <Badge variant="secondary">
            {t("brands.settingsVersion", { n: brand.settings_version })}
          </Badge>
        </div>
        {readOnly ? (
          <Badge variant="outline">{t("common.readOnly")}</Badge>
        ) : (
          <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending || !name.trim()}>
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        )}
      </div>

      <Tabs defaultValue="identity" dir={dir}>
        <TabsList>
          {(
            ["identity", "voice", "visual", "audience", "claims", "assets", "history"] as const
          ).map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(`brands.tab.${k}` as MessageKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        <fieldset disabled={readOnly} className="contents">
          <TabsContent value="identity">
            <Section title={t("brands.tab.identity")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="b-name">{t("brands.name")}</Label>
                  <Input
                    id="b-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="b-lang">{t("brands.language")}</Label>
                  <NativeSelect
                    id="b-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="ar">العربية (ar)</option>
                    <option value="en">English (en)</option>
                  </NativeSelect>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="b-desc">{t("brands.description")}</Label>
                <Textarea
                  id="b-desc"
                  rows={4}
                  dir="auto"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="voice">
            <Section title={t("brands.tab.voice")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="v-tone">{t("brands.voice.tone")}</Label>
                  <Input
                    id="v-tone"
                    dir="auto"
                    value={s.voice?.tone ?? ""}
                    onChange={(e) => update("voice", { ...s.voice, tone: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="v-personality">{t("brands.voice.personality")}</Label>
                  <Input
                    id="v-personality"
                    dir="auto"
                    value={s.voice?.personality ?? ""}
                    onChange={(e) => update("voice", { ...s.voice, personality: e.target.value })}
                  />
                </div>
                <ListField
                  id="v-do"
                  label={t("brands.voice.do")}
                  value={s.voice?.do}
                  onChange={(v) => update("voice", { ...s.voice, do: v })}
                />
                <ListField
                  id="v-dont"
                  label={t("brands.voice.dont")}
                  value={s.voice?.dont}
                  onChange={(v) => update("voice", { ...s.voice, dont: v })}
                />
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="visual" className="flex flex-col gap-4">
            <Section title={t("brands.palette")}>
              <ul className="flex flex-col gap-2">
                {(s.palette ?? []).map((c, i) => (
                  <li key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
                    <input
                      type="color"
                      aria-label={c.name || c.hex}
                      value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#000000"}
                      onChange={(e) =>
                        update(
                          "palette",
                          (s.palette ?? []).map((x, j) =>
                            j === i ? { ...x, hex: e.target.value } : x,
                          ),
                        )
                      }
                      className="size-9 cursor-pointer rounded-md border bg-card p-1"
                    />
                    <Input
                      placeholder={t("brands.palette.name")}
                      value={c.name}
                      onChange={(e) =>
                        update(
                          "palette",
                          (s.palette ?? []).map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder={t("brands.palette.role")}
                      value={c.role ?? ""}
                      onChange={(e) =>
                        update(
                          "palette",
                          (s.palette ?? []).map((x, j) =>
                            j === i ? { ...x, role: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("common.remove")}
                      onClick={() =>
                        update(
                          "palette",
                          (s.palette ?? []).filter((_, j) => j !== i),
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  update("palette", [...(s.palette ?? []), { name: "", hex: "#4f46e5", role: "" }])
                }
              >
                <Plus />
                {t("brands.palette.add")}
              </Button>
            </Section>
            <Section title={t("brands.typography.rules")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ty-h">{t("brands.typography.heading")}</Label>
                  <Input
                    id="ty-h"
                    value={s.typography?.heading_font ?? ""}
                    onChange={(e) =>
                      update("typography", { ...s.typography, heading_font: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ty-b">{t("brands.typography.body")}</Label>
                  <Input
                    id="ty-b"
                    value={s.typography?.body_font ?? ""}
                    onChange={(e) =>
                      update("typography", { ...s.typography, body_font: e.target.value })
                    }
                  />
                </div>
              </div>
              <Textarea
                dir="auto"
                rows={3}
                aria-label={t("brands.typography.rules")}
                value={s.typography?.rules ?? ""}
                onChange={(e) => update("typography", { ...s.typography, rules: e.target.value })}
              />
            </Section>
          </TabsContent>

          <TabsContent value="audience" className="flex flex-col gap-4">
            <Section title={t("brands.audiences")}>
              <ul className="flex flex-col gap-3">
                {(s.audiences ?? []).map((a, i) => (
                  <li
                    key={a.id}
                    className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_auto]"
                  >
                    <Input
                      placeholder={t("brands.name")}
                      dir="auto"
                      value={a.name}
                      onChange={(e) =>
                        update(
                          "audiences",
                          (s.audiences ?? []).map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder={t("brands.description")}
                      dir="auto"
                      value={a.description ?? ""}
                      onChange={(e) =>
                        update(
                          "audiences",
                          (s.audiences ?? []).map((x, j) =>
                            j === i ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("common.remove")}
                      onClick={() =>
                        update(
                          "audiences",
                          (s.audiences ?? []).filter((_, j) => j !== i),
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  update("audiences", [
                    ...(s.audiences ?? []),
                    { id: `aud_${crypto.randomUUID().slice(0, 8)}`, name: "", description: "" },
                  ])
                }
              >
                <Plus />
                {t("brands.audiences.add")}
              </Button>
            </Section>
            <Section title={t("brands.platformRules")}>
              <div className="grid gap-4 sm:grid-cols-2">
                {PLATFORMS.map((p) => (
                  <div key={p} className="flex flex-col gap-2">
                    <Label htmlFor={`pr-${p}`} className="capitalize">
                      {p}
                    </Label>
                    <Textarea
                      id={`pr-${p}`}
                      rows={3}
                      dir="auto"
                      value={s.platform_rules?.[p] ?? ""}
                      onChange={(e) =>
                        update("platform_rules", { ...s.platform_rules, [p]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="claims" className="flex flex-col gap-4">
            <Section title={t("brands.tab.claims")}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cta-default">{t("brands.cta.default")}</Label>
                <Input
                  id="cta-default"
                  dir="auto"
                  value={s.cta?.default ?? ""}
                  onChange={(e) => update("cta", { ...s.cta, default: e.target.value })}
                />
              </div>
              <ListField
                id="cta-preferred"
                label={t("brands.cta.preferred")}
                value={s.cta?.preferred}
                onChange={(v) => update("cta", { ...s.cta, preferred: v })}
              />
              <div className="grid gap-4 md:grid-cols-3">
                <ListField
                  id="cl-ok"
                  label={t("brands.claims.permitted")}
                  value={s.claims?.permitted}
                  onChange={(v) => update("claims", { ...s.claims, permitted: v })}
                />
                <ListField
                  id="cl-no"
                  label={t("brands.claims.prohibited")}
                  value={s.claims?.prohibited}
                  onChange={(v) => update("claims", { ...s.claims, prohibited: v })}
                />
                <ListField
                  id="cl-verify"
                  label={t("brands.claims.verify")}
                  value={s.claims?.requires_verification}
                  onChange={(v) => update("claims", { ...s.claims, requires_verification: v })}
                />
              </div>
            </Section>
          </TabsContent>
        </fieldset>

        <TabsContent value="assets">
          <BrandAssets brandId={brand.id} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="history">
          <BrandHistory brandId={brand.id} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function BrandAssets({ brandId, readOnly }: { brandId: string; readOnly: boolean }) {
  const { t, locale } = useI18n();
  const assets = useBrandAssets(brandId);
  const qc = useQueryClient();
  const [type, setType] = useState<BrandAsset["asset_type"]>("logo");
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const upload = useMutation({
    mutationFn: async () => {
      const f = file!;
      const bytes = new Uint8Array(await f.arrayBuffer());
      const checksum = await sha256Hex(bytes);
      const safeName = f.name.replace(/[^\w.-]+/g, "_");
      const version =
        1 +
        Math.max(
          0,
          ...(assets.data ?? [])
            .filter((a) => a.asset_type === type && a.name === safeName)
            .map((a) => a.version),
        );
      const path = `${brandId}/${type}/${version}/${safeName}`;
      const up = await supabase.storage
        .from("brand-assets")
        .upload(path, f, { contentType: f.type || undefined, upsert: false });
      if (up.error) throw up.error;
      const { error } = await supabase.from("brand_assets").insert({
        brand_id: brandId,
        asset_type: type,
        name: safeName,
        storage_path: path,
        mime_type: f.type || null,
        file_size: f.size,
        checksum,
        version,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("brands.assets.uploaded"));
      setFile(null);
      setInputKey((k) => k + 1);
      void qc.invalidateQueries({ queryKey: ["brand-assets", brandId] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Section title={t("brands.tab.assets")}>
      {!readOnly && (
        <div className="grid gap-2 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="asset-type">{t("brands.assets.type")}</Label>
            <NativeSelect
              id="asset-type"
              value={type}
              onChange={(e) => setType(e.target.value as BrandAsset["asset_type"])}
            >
              {ASSET_TYPES.map((a) => (
                <option key={a} value={a}>
                  {t(`brands.assetType.${a}` as MessageKey)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Input
            key={inputKey}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            aria-label={t("brands.assets.file")}
          />
          <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
            <FileUp />
            {t("brands.assets.upload")}
          </Button>
        </div>
      )}
      {assets.isLoading ? (
        <ListSkeleton rows={2} />
      ) : !assets.data?.length ? (
        <p className="text-sm text-muted-foreground">{t("brands.assets.empty")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {assets.data.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <Badge variant="secondary">
                {t(`brands.assetType.${a.asset_type}` as MessageKey)}
              </Badge>
              <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
              <span className="text-muted-foreground">{t("common.version", { n: a.version })}</span>
              <span className="text-muted-foreground">{formatBytes(a.file_size)}</span>
              <span className="text-muted-foreground">{formatDateTime(a.created_at, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function BrandHistory({ brandId }: { brandId: string }) {
  const { t, locale } = useI18n();
  const history = useBrandHistory(brandId);
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => setOpen(null), [brandId]);
  if (history.isLoading) return <ListSkeleton rows={3} />;
  if (!history.data?.length)
    return <p className="text-sm text-muted-foreground">{t("brands.history.empty")}</p>;
  return (
    <Section title={t("brands.tab.history")}>
      <ul className="flex flex-col gap-2">
        {history.data.map((h) => (
          <li key={h.id} className="rounded-lg border">
            <button
              type="button"
              className="flex w-full items-center justify-between p-3 text-start text-sm"
              onClick={() => setOpen(open === h.version ? null : h.version)}
              aria-expanded={open === h.version}
            >
              <span className="font-medium">{t("brands.settingsVersion", { n: h.version })}</span>
              <span className="text-muted-foreground">{formatDateTime(h.created_at, locale)}</span>
            </button>
            {open === h.version && (
              <pre className="max-h-80 overflow-auto border-t bg-muted/40 p-3 text-xs" dir="ltr">
                {JSON.stringify(h.settings, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
