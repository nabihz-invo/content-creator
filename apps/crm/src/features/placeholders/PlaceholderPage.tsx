import { Construction } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";

export function PlaceholderPage({
  title,
  description,
  phase,
}: {
  title: MessageKey;
  description: MessageKey;
  phase: string;
}) {
  const { t } = useI18n();
  return (
    <>
      <PageHeader
        title={t(title)}
        actions={<Badge variant="info">{t("common.comingIn", { phase })}</Badge>}
      />
      <EmptyState icon={<Construction className="size-5" />} message={t(description)} />
    </>
  );
}
