import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { useCurrentBrief, WORKING_STATUSES } from "@/lib/queries";
import type { ContentProject } from "@/types/db";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function BriefPanel({ project }: { project: ContentProject }) {
  const { t, locale } = useI18n();
  const brief = useCurrentBrief(project.id, WORKING_STATUSES.has(project.status));
  if (project.status === "validating_answers") {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          {t("brief.writing")}
        </CardContent>
      </Card>
    );
  }
  const b = brief.data;
  if (!b || b.validation_status !== "valid") {
    const contradictions = b?.validation_details?.contradictions ?? [];
    return (
      <div className="flex flex-col gap-3">
        {contradictions.length > 0 && (
          <Card className="border-warning/50">
            <CardHeader>
              <CardTitle className="text-base">{t("config.contradictions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc ps-5 text-sm">
                {contradictions.map((c, i) => (
                  <li key={i}>{c[locale]}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        <p className="text-sm text-muted-foreground">{t("brief.empty")}</p>
      </div>
    );
  }
  const d = b.brief;
  const dir = d.language === "en" ? "ltr" : "rtl";
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{t("brief.title")}</CardTitle>
        <div className="flex gap-2">
          <Badge variant="info">{t(`contentType.${d.content_type}` as MessageKey)}</Badge>
          <Badge variant="secondary">{d.aspect_ratio}</Badge>
          {d.duration_seconds && <Badge variant="secondary">{d.duration_seconds}s</Badge>}
          {d.slide_count && <Badge variant="secondary">{d.slide_count}×</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Row label={t("brief.keyMessage")}>
          <span className="text-base font-medium" dir={textDir(d.key_message)}>
            {d.key_message}
          </span>
        </Row>
        <Row label={t("brief.hook")}>
          <span dir={dir}>{d.hook}</span>
        </Row>
        {d.supporting_points.length > 0 && (
          <Row label={t("brief.supporting")}>
            <ul className="list-disc ps-5" dir={dir}>
              {d.supporting_points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </Row>
        )}
        <Row label={t("brief.beats")}>
          <ol className="list-decimal ps-5" dir={dir}>
            {d.narrative_beats.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </Row>
        <Row label={t("brief.visual")}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{d.visual.style}</Badge>
            <Badge variant="outline">{d.visual.color_mode}</Badge>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs">
              <span
                className="size-3.5 rounded-full border"
                style={{ background: d.visual.accent_color }}
              />
              {d.visual.accent_color}
            </span>
            {d.visual.camera_style && <Badge variant="outline">{d.visual.camera_style}</Badge>}
            {d.visual.post_fx && <Badge variant="outline">{d.visual.post_fx}</Badge>}
          </div>
          {d.visual.style_notes && (
            <p className="mt-2 text-muted-foreground">{d.visual.style_notes}</p>
          )}
        </Row>
        <Row label={t("brief.cta")}>
          <span dir={dir}>{d.cta.text}</span>
          {d.cta.url && (
            <span className="ms-2 text-muted-foreground" dir="ltr">
              {d.cta.url}
            </span>
          )}
        </Row>
        {d.facts_to_include.length > 0 && (
          <Row label={t("brief.facts")}>
            <ul className="list-disc ps-5">
              {d.facts_to_include.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </Row>
        )}
        {d.claims_requiring_verification.length > 0 && (
          <Row label={t("brief.claims")}>
            <ul className="list-disc ps-5 text-warning">
              {d.claims_requiring_verification.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </Row>
        )}
        {d.assumptions.length > 0 && (
          <Row label={t("brief.assumptions")}>
            <ul className="flex flex-col gap-1">
              {d.assumptions.map((a, i) => (
                <li key={i}>
                  <code className="text-xs text-muted-foreground">{a.question_id}</code> → {a.value}
                  <span className="text-muted-foreground"> — {a.reason}</span>
                </li>
              ))}
            </ul>
          </Row>
        )}
      </CardContent>
    </Card>
  );
}
