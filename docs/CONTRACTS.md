# JSON Contracts

Canonical JSON Schemas live in `packages/shared/schemas/*.schema.json`
(draft 2020-12). This file shows the shape and intent of each; when the schema
files exist they win. Every AI stage must output JSON matching these, and is
validated before saving.

## 1. Normalized intake record

```json
{
  "input_source": "manual | telegram | csv | url",
  "original_idea": "string (required unless source_url given)",
  "source_url": "https://… | null",
  "source_reference": "telegram message id | csv row number | null",
  "source_metadata": { "telegram_chat_id": "…", "csv_batch_id": "…", "fetched_title": "…" },
  "brand_id": "uuid | null",
  "submitter_id": "uuid",
  "submitted_at": "ISO-8601",
  "tags": ["string"]
}
```

## 2. Analysis (`analysis.schema.json`)

```json
{
  "topic": "string",
  "objective": "awareness | engagement | education | conversion | announcement | other",
  "audience": { "description": "string", "profile_id": "string | null" },
  "proposed_format": "static | carousel | video",
  "format_rationale": "string",
  "brand_relevance": { "score": 0.0, "notes": "string" },
  "language": "ar | en | …",
  "platforms": [{ "platform": "instagram | tiktok | linkedin | x | facebook | youtube", "suitability": 0.0 }],
  "known_facts": { "key": "value" },
  "missing_information": ["string"],
  "claims_to_verify": [{ "claim": "string", "reason": "string" }],
  "risk_flags": ["string"]
}
```

## 3. Questionnaire (`questionnaire.schema.json`)

```json
{
  "version": 1,
  "groups": [{ "id": "goal", "label": "Goal & audience", "order": 1 }],
  "questions": [
    {
      "id": "q_cta",                       // stable, snake_case, never reused
      "group": "goal",
      "label": "What should viewers do?",
      "explanation": "Used for the closing CTA.",
      "type": "text | textarea | select | radio | checkbox | url",
      "required": true,
      "default": "brand_default | literal | null",
      "options": [{ "value": "visit_site", "label": "Visit website" }],
      "allow_ai_decide": true,
      "show_if": { "question": "q_format", "op": "eq | neq | in | not_empty", "value": "video" },
      "validation": { "min_length": 3, "max_length": 280, "pattern": null }
    }
  ]
}
```

Answers (`answers.schema.json`): `{ "<question_id>": value | { "ai_decide": true } }`.

## 4. Content brief (`brief.schema.json`)

```json
{
  "project_id": "uuid",
  "brand_id": "uuid",
  "brand_settings_version": 3,
  "content_type": "static | carousel | video",
  "objective": "string",
  "audience": "string",
  "language": "ar",
  "direction": "rtl | ltr",
  "platforms": [{ "platform": "instagram", "aspect_ratio": "4:5", "width": 1080, "height": 1350 }],
  "key_message": "string",
  "supporting_points": ["string"],
  "tone": "string",
  "cta": { "text": "string", "url": "string | null" },
  "constraints": { "duration_seconds": 30, "slide_count": 7 },
  "verified_claims": ["string"],
  "prohibited_claims": ["string"],
  "assumptions": [{ "question_id": "q_x", "decided_by": "ai | brand_default", "value": "…" }]
}
```

## 5. Script (`script.<type>.schema.json`)

Common: `{ "content_type", "language", "direction", "caption", "hashtags": [], "cta" }`.

- **video:** `hook`, `total_duration_s`, `scenes[] { id, start_s, end_s, voiceover, on_screen_text, visual, camera_motion, transition_out, sound }`, `music_direction`, `closing_cta`.
- **carousel:** `slides[] { index, role: cover|body|cta, headline, supporting_text, visual }`.
- **static:** `headline`, `body`, `visual_composition`.

`content_hash` = SHA-256 of canonical (sorted-keys) JSON of `content`.

## 6. Content spec for creative generation (`content-spec.schema.json`)

```json
{
  "project_id": "uuid",
  "creative_version": 2,
  "script": { "id": "uuid", "version": 4, "content_hash": "sha256" },
  "brand": { "id": "uuid", "settings_version": 3, "palette": {}, "typography": {}, "logo_paths": [] },
  "format": { "content_type": "carousel", "width": 1080, "height": 1350, "fps": null, "duration_s": null },
  "template": { "id": "string | null", "style_notes": "string" },
  "direction": "rtl",
  "units": [{ "id": "slide-1", "kind": "slide | scene", "content": {}, "timing": { "start_s": 0, "end_s": 3 } }],
  "assets": [{ "id": "logo", "storage_path": "brand-assets/…", "role": "logo" }],
  "export": { "outputs": ["png", "carousel"], "deterministic_timeline": true },
  "revision_notes": "reviewer comments for this revision | null"
}
```

## 7. Worker job / result

Job (`worker-job.schema.json`, stored in `workflow_jobs.input_reference`):

```json
{ "job_id": "uuid", "kind": "creative_worker | render_worker", "project_id": "uuid",
  "idempotency_key": "string", "payload": { "content_spec_path": "…" | "creative_version_id": "…", "output_type": "png|carousel|mp4" },
  "limits": { "timeout_s": 900, "max_memory_mb": 2048, "max_output_mb": 500 } }
```

Creative worker result (`worker-result.schema.json`):

```json
{ "status": "succeeded | failed",
  "repository_url": "https://github.com/<org>/content-creatives",
  "commit_sha": "40-hex", "source_path": "projects/<id>/v2",
  "preview": { "storage_prefix": "previews/<id>/creative-v2/", "entry": "index.html", "thumbnails": ["…png"] },
  "checks": [{ "name": "html-validate", "passed": true }],
  "content_hash": "sha256 of source tree",
  "errors": [] }
```

## 8. Media manifest (`media-manifest.schema.json`)

```json
{ "project_id": "uuid", "creative_version_id": "uuid", "render_job_id": "uuid",
  "output_type": "carousel",
  "items": [{ "media_asset_id": "uuid", "order": 1, "storage_path": "media/…/slide-01.png",
              "mime_type": "image/png", "width": 1080, "height": 1350, "checksum": "sha256" }],
  "manifest_hash": "sha256" }
```

## 9. Publishing package (`publish-package.schema.json`)

```json
{ "platform": "instagram", "connected_account_id": "uuid", "approval_id": "uuid",
  "manifest_hash": "sha256", "caption": "string", "hashtags": ["string"], "link": "string | null",
  "scheduled_at": "ISO-8601 | null", "idempotency_key": "string" }
```
