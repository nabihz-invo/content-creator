import type { CarouselScript, Script, StaticScript, VideoScript, VideoScene } from "@cc/shared";
import { Camera, Music, Type, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SCENE_COLORS = [
  "bg-primary/70",
  "bg-success/70",
  "bg-warning/80",
  "bg-destructive/60",
  "bg-primary/40",
  "bg-success/40",
];

const isVideo = (s: Script): s is VideoScript => Array.isArray((s as VideoScript).scenes);
const isCarousel = (s: Script): s is CarouselScript => Array.isArray((s as CarouselScript).slides);

function changed(a: unknown, b: unknown) {
  return b !== undefined && JSON.stringify(a) !== JSON.stringify(b);
}

function Changed() {
  const { t } = useI18n();
  return <Badge variant="warning">{t("script.changed")}</Badge>;
}

function Scene({ scene, prev }: { scene: VideoScene; prev?: VideoScene }) {
  const { t } = useI18n();
  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-semibold">{t("script.scene", { n: scene.index })}</span>
        <Badge variant="secondary" className="tabular-nums" dir="ltr">
          {scene.start_s}s → {scene.end_s}s
        </Badge>
        <span className="text-sm text-muted-foreground">{scene.purpose}</span>
        {prev && changed(scene, prev) && <Changed />}
      </div>
      {scene.on_screen_text && (
        <div
          className="mb-3 rounded-lg bg-foreground px-4 py-3 text-lg font-semibold text-background"
          dir={textDir(scene.on_screen_text)}
        >
          {scene.on_screen_text}
        </div>
      )}
      <dl className="grid gap-2 text-sm">
        <div className="flex gap-2">
          <Type
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-label={t("script.visual")}
          />
          <dd>{scene.visual}</dd>
        </div>
        <div className="flex gap-2">
          <Camera
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-label={t("script.camera")}
          />
          <dd>
            {scene.camera.move}{" "}
            <span className="text-xs text-muted-foreground" dir="ltr">
              ({scene.camera.easing})
            </span>
          </dd>
        </div>
        {scene.voiceover && (
          <div className="flex gap-2">
            <Volume2
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-label={t("script.voiceover")}
            />
            <dd className="italic" dir={textDir(scene.voiceover)}>
              “{scene.voiceover}”
            </dd>
          </div>
        )}
        <div className="flex gap-2 text-muted-foreground">
          <Music className="mt-0.5 size-4 shrink-0" aria-label={t("script.sound")} />
          <dd>
            {scene.sound} · {t("script.transition")}: {scene.transition_out}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function VideoView({ s, prev }: { s: VideoScript; prev?: VideoScript }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{s.hook}</span>
          <span className="text-muted-foreground">
            {t("script.total", { s: s.total_duration_s, n: s.scenes.length })}
          </span>
        </div>
        <div className="flex h-8 overflow-hidden rounded-lg border" dir="ltr" aria-hidden>
          {s.scenes.map((sc, i) => (
            <div
              key={sc.index}
              className={cn(
                "flex items-center justify-center border-e border-background text-[11px] font-medium text-white",
                SCENE_COLORS[i % SCENE_COLORS.length],
              )}
              style={{ width: `${((sc.end_s - sc.start_s) / s.total_duration_s) * 100}%` }}
              title={`${sc.start_s}–${sc.end_s}s`}
            >
              {sc.index}
            </div>
          ))}
        </div>
      </div>
      <ol className="flex flex-col gap-3">
        {s.scenes.map((sc, i) => (
          <Scene key={sc.index} scene={sc} prev={prev?.scenes[i]} />
        ))}
      </ol>
      <div className="grid gap-1 text-sm">
        <div>
          <span className="text-muted-foreground">{t("script.closingCta")}: </span>
          {s.closing_cta}
        </div>
        <div>
          <span className="text-muted-foreground">{t("script.music")}: </span>
          {s.music_direction}
        </div>
      </div>
    </div>
  );
}

function CarouselView({ s, prev }: { s: CarouselScript; prev?: CarouselScript }) {
  const { t } = useI18n();
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {s.slides.map((sl, i) => (
        <li key={sl.index} className="flex aspect-[4/5] flex-col rounded-xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="font-semibold">{t("script.slide", { n: sl.index })}</span>
            <Badge
              variant={sl.role === "cover" ? "info" : sl.role === "cta" ? "success" : "secondary"}
            >
              {sl.role}
            </Badge>
            {prev && changed(sl, prev.slides[i]) && <Changed />}
          </div>
          <div className="text-lg leading-snug font-bold" dir={textDir(sl.headline)}>
            {sl.headline}
          </div>
          <p className="mt-2 text-sm" dir={textDir(sl.supporting_text)}>
            {sl.supporting_text}
          </p>
          <p className="mt-auto pt-3 text-xs text-muted-foreground">{sl.visual}</p>
        </li>
      ))}
    </ol>
  );
}

function StaticView({ s }: { s: StaticScript }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex aspect-square w-full max-w-md flex-col rounded-xl border bg-card p-6">
      <div className="text-2xl leading-tight font-bold" dir={textDir(s.headline)}>
        {s.headline}
      </div>
      <p className="mt-3" dir={textDir(s.body)}>
        {s.body}
      </p>
      <p className="mt-auto pt-4 text-xs text-muted-foreground">
        {t("script.composition")}: {s.visual_composition}
      </p>
      <div className="mt-2 font-medium text-primary">{s.cta}</div>
    </div>
  );
}

export function ScriptView({ script, previous }: { script: Script; previous?: Script }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      {isVideo(script) ? (
        <VideoView s={script} prev={previous && isVideo(previous) ? previous : undefined} />
      ) : isCarousel(script) ? (
        <CarouselView s={script} prev={previous && isCarousel(previous) ? previous : undefined} />
      ) : (
        <StaticView s={script as StaticScript} />
      )}
      <div className="rounded-lg bg-muted/50 p-4 text-sm">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {t("script.caption")}
          {previous && changed(script.caption, previous.caption) && <Changed />}
        </div>
        <p className="whitespace-pre-wrap" dir={textDir(script.caption)}>
          {script.caption}
        </p>
        {script.hashtags.length > 0 && (
          <p className="mt-2 text-primary" dir="ltr">
            {script.hashtags.join(" ")}
          </p>
        )}
      </div>
    </div>
  );
}
