import type { Locale } from "./i18n";

export function formatDateTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatRelative(iso: string, locale: Locale, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDateTime(iso, locale);
}

export function formatBytes(n: number | null | undefined) {
  if (n == null) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Text direction for user content (ideas can be Arabic in an English UI and vice versa). */
export function textDir(text: string | null | undefined): "rtl" | "ltr" | "auto" {
  if (!text) return "auto";
  const m = text.match(/[\p{L}]/u);
  if (!m) return "auto";
  return /[֐-ࣿ]/.test(m[0]) ? "rtl" : "ltr";
}
