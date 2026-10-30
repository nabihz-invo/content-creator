# 0006 — AI-proposed production configuration, approved by the user

**Status:** accepted (2026-10-30, requested by the project owner)

## Context
The owner wants the AI to do the first pass: when an idea arrives, the AI
analyzes it and **proposes a filled-in configuration** (format, platform,
aspect ratio, visual style, narrative beats, colors, duration, CTA…). The user
reviews, edits, and **approves** it; only then does writing start. The
configuration must capture exactly what later prompts need — in particular the
3D motion-graphics prompt architecture (deterministic `t`-driven Three.js,
theme/shader style, cinematic camera, 2D text overlay, post-processing chain).

## Decision
1. **Stable configuration catalog.** `packages/shared/src/config-catalog.ts`
   defines the questions downstream prompts depend on, with stable IDs
   (`q_core_message`, `q_format`, `q_aspect_ratio`, `q_visual_style`,
   `q_scene_beats`, `q_camera_style`, `q_accent_color`, `q_post_fx`, …),
   bilingual labels, options, and `show_if` rules per format.
2. **The AI selects and pre-fills; code builds the form.** The analysis stage
   returns structured JSON: an analysis, a suggested value + bilingual
   rationale + confidence for catalog questions, questions to skip, and up to
   five custom questions for genuinely missing information. The server merges
   this with the catalog and brand defaults, drops suggestions that don't fit a
   question's options, and stores the result as a questionnaire version. Labels
   and structure therefore never depend on model output.
3. **Approval is recorded.** Submitting the reviewed configuration inserts an
   `approvals` row (`stage = 'config'`, artifact = the submitted answers row,
   hashed) and moves the project to `validating_answers`. Nothing is written
   before this approval.
4. **Stage logic lives in code, n8n orchestrates.** AI stages (analysis, brief,
   script) run in the `api` Edge Function (`/api/internal/run-job`, HMAC) so
   prompts, schemas, and validation are versioned and tested in this repo.
   n8n workflows are thin: webhook → run-job; notifications; recovery cron.
   Long calls run in the background (`EdgeRuntime.waitUntil`) and stream.
5. **Claude API usage.** Official SDK (`@anthropic-ai/sdk`), model
   `claude-opus-5-5` by default (overridable per stage in `ai_settings`),
   structured outputs (`output_config.format` json_schema; schemas are
   strict-compatible and re-validated with ajv for length/range limits), explicit
   `effort` per stage, server-side refusal fallbacks
   (`fallbacks: "default"`), one retry with validation feedback. A
   deterministic `fake` provider (`AI_PROVIDER=fake`) powers local dev, CI,
   and e2e without spending tokens.
6. **Creative prompt is built deterministically.** `buildCreativePrompt()`
   renders the motion-graphics (or HTML static/carousel) system instruction
   from the approved configuration, brand snapshot, and approved script — no
   LLM involved — so Phase 3 sends Claude Code a reviewable, reproducible prompt.
   The CRM shows it on the approved script.

Phase 2 task IDs were redefined to match this design before any P2 task was
started.

## Consequences
- Downstream stages read configuration by stable ID; adding a question is a
  catalog change plus a catalog version bump.
- The AI cannot inject UI text outside its rationale/custom-question fields,
  which are rendered as plain text.
