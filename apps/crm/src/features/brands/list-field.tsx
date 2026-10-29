import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

/** Edits a string[] as one item per line. */
export function ListField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string[] | undefined;
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={4}
        disabled={disabled}
        dir="auto"
        value={(value ?? []).join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trimStart()))}
        onBlur={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
      />
      <p className="text-xs text-muted-foreground">{t("brands.listHint")}</p>
    </div>
  );
}
