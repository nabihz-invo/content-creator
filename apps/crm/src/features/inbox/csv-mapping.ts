/** Client-side CSV helpers for the import dialog (the server re-validates everything). */
import Papa from "papaparse";

export const CSV_FIELDS = [
  "idea",
  "url",
  "title",
  "brand",
  "tags",
  "content_type",
  "language",
] as const;
export type CsvField = (typeof CSV_FIELDS)[number];

const SYNONYMS: Record<CsvField, string[]> = {
  idea: [
    "idea",
    "ideas",
    "concept",
    "content",
    "text",
    "description",
    "topic",
    "فكرة",
    "الفكرة",
    "المحتوى",
    "النص",
    "الوصف",
  ],
  url: ["url", "link", "links", "source", "source url", "website", "رابط", "الرابط", "المصدر"],
  title: ["title", "headline", "name", "عنوان", "العنوان"],
  brand: ["brand", "brand name", "client", "علامة", "العلامة", "العلامة التجارية", "العميل"],
  tags: ["tags", "tag", "labels", "categories", "وسوم", "الوسوم", "تصنيف"],
  content_type: ["format", "type", "content type", "content_type", "صيغة", "الصيغة", "النوع"],
  language: ["language", "lang", "لغة", "اللغة"],
};

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[_\-\s]+/g, " ");

/** Guesses a mapping from header names (English and Arabic synonyms). */
export function guessMapping(headers: string[]): Partial<Record<CsvField, string>> {
  const mapping: Partial<Record<CsvField, string>> = {};
  const used = new Set<string>();
  for (const field of CSV_FIELDS) {
    const hit = headers.find(
      (h) => !used.has(h) && SYNONYMS[field].some((syn) => norm(syn) === norm(h)),
    );
    if (hit) {
      mapping[field] = hit;
      used.add(hit);
    }
  }
  return mapping;
}

/** Same decoding as the server: UTF-8 (BOM ok), falling back to Windows-1256. */
export function decodeCsvBytes(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("windows-1256").decode(bytes);
  }
}

export function previewCsv(text: string, rows = 5): { headers: string[]; rows: string[][] } {
  const res = Papa.parse<string[]>(text, { preview: rows + 1, skipEmptyLines: "greedy" });
  const [header = [], ...body] = res.data;
  return { headers: header.map((h) => h.trim()), rows: body };
}
