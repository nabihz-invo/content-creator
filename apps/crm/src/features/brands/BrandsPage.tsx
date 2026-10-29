import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useI18n } from "@/lib/i18n";
import { useBrands } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/lib/workspace";

export function BrandsPage() {
  const { t } = useI18n();
  const { workspaceId, can } = useWorkspace();
  const brands = useBrands(workspaceId);

  return (
    <>
      <PageHeader
        title={t("brands.title")}
        subtitle={t("brands.subtitle")}
        actions={can("admin") && <NewBrandDialog />}
      />
      {brands.isError ? (
        <ErrorState error={brands.error} onRetry={() => void brands.refetch()} />
      ) : brands.isLoading ? (
        <ListSkeleton rows={3} />
      ) : !brands.data?.length ? (
        <EmptyState
          icon={<Palette className="size-5" />}
          message={t("brands.empty")}
          action={can("admin") && <NewBrandDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.data.map((b) => (
            <Link
              key={b.id}
              to={`/brands/${b.id}`}
              className="group rounded-xl border bg-card p-5 shadow-xs transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{b.name}</div>
                  <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {b.description || "—"}
                  </div>
                </div>
                <Badge variant="secondary">
                  {t("brands.settingsVersion", { n: b.settings_version })}
                </Badge>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                {(b.brand_settings.palette ?? []).slice(0, 6).map((c, i) => (
                  <span
                    key={i}
                    className="size-5 rounded-full border shadow-xs"
                    style={{ background: c.hex }}
                    title={c.name}
                  />
                ))}
                <span className="ms-auto text-xs text-muted-foreground uppercase">
                  {b.default_language}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function NewBrandDialog() {
  const { t, dir } = useI18n();
  const { workspaceId } = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("ar");
  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          default_language: language,
          brand_settings: { languages: [language] },
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ["brands"] });
      setOpen(false);
      navigate(`/brands/${id}`);
    },
  });
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim()) create.mutate();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {t("brands.new")}
        </Button>
      </DialogTrigger>
      <DialogContent dir={dir} closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("brands.new")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="brand-name">{t("brands.name")}</Label>
            <Input
              id="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="brand-lang">{t("brands.language")}</Label>
            <NativeSelect
              id="brand-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="ar">العربية (ar)</option>
              <option value="en">English (en)</option>
            </NativeSelect>
          </div>
          {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
          <DialogFooter>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? t("common.saving") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
