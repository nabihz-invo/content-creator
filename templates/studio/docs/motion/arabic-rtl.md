# Arabic / RTL / Mixed-Language Rules

## Core rules
- Set `direction: rtl` and `lang="ar"` on Arabic text blocks. Use `unicode-bidi: isolate` for mixed inline content (e.g. English brand inside an Arabic sentence).
- NEVER apply letter-spacing to Arabic (breaks letter joining).
- NEVER animate Arabic letter by letter or split into characters; animate by word or by line. Splitting breaks shaping.
- Do not use italic synthesis for Arabic; use a font with a real alternative weight or color/size contrast.
- Arabic needs more line height (about 1.35-1.5) than Latin; diacritics and tall letters get clipped otherwise.
- Highlight pairing: main sans Arabic + accent in a calligraphic or serif Arabic (see below), mirroring "sans + serif/script" in English.

## Font pairings (verify license and availability on Google Fonts before use)
- Main: Tajawal, IBM Plex Sans Arabic, Cairo, Almarai.
- Accent (calligraphic/serif feel): Amiri, Noto Naskh Arabic, Aref Ruqaa, Reem Kufi (geometric).
- English counterpart in bilingual edits: Inter (main) + Playfair Display Italic (accent).

## Layout mirroring
- Mirror directional layouts: lines draw right to left, slide-ins come from the right, progress/graph reads right to left only if the content is Arabic prose; numeric charts may keep a left-to-right time axis (state the choice in the plan).
- Side scenes: swap sides so text reads first on the right.
- Captions: word-timed highlight moves right to left.

## Transcription
- Prefer a dialect-aware transcription pass and ask the user which dialect (Gulf, Levantine, Egyptian, MSA). Captions in MSA or dialect spelling per user preference, stated in the plan.
- Always show the user the transcript for correction before building captions (word errors are highly visible).

## Mixed-language scripts
- Keep each language's font family for its own text; match visual weight and x-height.
- Numerals: ask whether to use Western (1,2,3) or Arabic-Indic digits; stay consistent.

## QA specifics
- Check every Arabic caption for broken joins, wrong word order in mixed lines, and punctuation placement (punctuation on the wrong side is the most common bug).
