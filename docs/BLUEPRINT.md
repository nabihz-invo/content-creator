# AI Social Media Content Pipeline — Technical Blueprint v1.0

> Original product specification. This is the **source of truth for
> requirements**. Other docs elaborate on it; if they conflict, this file wins
> unless an ADR in `docs/adr/` records a deliberate change.

## 1. Product objective

Build a content-production CRM that transforms raw ideas into approved, branded
social media content and publishes it to connected platforms.

The system must support:

- Receiving ideas from Telegram, CSV imports, URLs, and the dashboard.
- Analyzing each idea with AI.
- Generating a complete, dynamic questionnaire before writing.
- Waiting for the user to complete the questionnaire.
- Creating and revising scripts or scenarios.
- Generating HTML/CSS creatives using Claude Code or another configured generation service.
- Previewing creative versions inside the CRM.
- Rendering approved creatives into PNG, carousel slides, and MP4.
- Requiring explicit approval at each configured approval gate.
- Scheduling and publishing approved content.
- Maintaining an audit trail of all stages, files, versions, and decisions.

**Core principle:** the system must be an approval-driven workflow engine, not
a single long-running AI conversation. Every stage must be persistent,
resumable, versioned, and independently retryable.

## 2. Technology stack

**Frontend:** ~~Lovable~~ (superseded by ADR-0001: Vite app built by Claude Code) · React and TypeScript · shadcn/ui · Supabase client ·
responsive desktop and mobile dashboard · RTL support for Arabic.

**Backend:** Supabase PostgreSQL · Supabase Authentication · Supabase Storage ·
Supabase Row Level Security · Supabase Edge Functions for short-lived API
operations and webhooks.

**Workflow orchestration:** existing self-hosted n8n installation · webhook
triggers · Telegram integration · AI model API integrations · scheduled and
asynchronous workflows · notifications and retries.

**Creative development:** Claude Code for source generation and iterative
development · GitHub for source code, version history, and approved template
versions · HTML/CSS and Three.js for creative rendering · Playwright for
browser-based preview and frame capture · FFmpeg for video encoding.

**Publishing:** Buffer API initially · direct social platform APIs later if
necessary · manual publishing fallback for unsupported formats or accounts.

**Rendering infrastructure:** a separate Node.js worker · Playwright and FFmpeg
installed in the worker environment · temporary disk for frame sequences ·
Supabase Storage or compatible object storage for final media · job queue with
retry and recovery support.

## 3. User roles

**Administrator**
- Manage brands and brand kits.
- Configure AI models, prompts, and integrations.
- Manage users and permissions.
- Review all projects and workflow failures.
- Configure approval policies and publishing accounts.

**Content editor**
- Submit ideas.
- Complete questionnaires.
- Edit scripts and captions.
- Request creative changes.
- Review and approve content according to assigned permissions.
- Schedule or publish approved content when authorized.

**Reviewer**
- Review assigned scripts and creatives.
- Approve or request changes.
- Add revision comments.
- Cannot modify protected integrations or system settings.

The initial personal-use deployment may have only one administrator. Implement
permissions in the backend so multi-user support can be added without
redesigning the database.

## 4. Main dashboard modules

**A. Overview** — ideas awaiting analysis; questionnaires awaiting answers;
scripts awaiting approval; creatives awaiting approval; rendering jobs in
progress; posts ready to publish; scheduled and published content; failed jobs
and items requiring attention.

**B. Idea inbox** — manual idea entry; Telegram submissions; CSV import with
field mapping; URL submission; source tracking; duplicate detection; bulk
import and processing; search, filtering, and tagging.

**C. Content projects** — each project contains: original idea and source;
brand and target audience; content objective and format; questionnaire and
answers; approved content brief; script versions; creative versions; rendered
assets; approval history; publishing jobs and results.

**D. Brand manager** — brand name and description; logo variants; color
palette; font files and typography rules; voice and tone; preferred language;
audience profiles; platform-specific design rules; CTA preferences; approved
reusable templates; claims that are permitted, prohibited, or require
verification; reference images and examples.

**E. Questionnaire editor** — AI-generated questions grouped into sections.
Supports: required and optional fields; text, dropdown, radio, checkbox, and
URL fields; conditional questions; brand defaults; "Let AI decide" options;
save draft; submit answers; edit and resubmit; missing-information validation.

**F. Script editor** — hook; narrative or scenario; scene sequence; voiceover;
on-screen text; visual direction; duration and timing; transitions; music or
sound direction; caption and CTA. Supports version history, inline comments,
regeneration, and approval.

**G. Creative studio** — HTML/CSS preview; isolated interactive preview for
Three.js; script and design configuration; version selector; asset list;
render settings; preview images; request-changes and approve actions. The
preview must be isolated from the main CRM origin. Do not execute arbitrary
generated code inside the CRM application.

**H. Media library** — PNGs; carousel slides; MP4s; thumbnails; source files;
asset dimensions and file sizes; version and approval state; storage location;
download and preview links.

**I. Publishing calendar** — drafts; approved posts; scheduled posts;
published posts; failed posts. Supports account selection, date and time
selection, caption editing, and publication status.

**J. Workflow monitor** — current stage; job start and completion times; last
successful step; retry count; error message; related project and asset
versions; retry and cancel actions for authorized users.

## 5. End-to-end workflow

### Stage 1: Receive the idea
Inputs: (1) Telegram text, voice note, image, or URL; (2) CSV upload
containing multiple ideas; (3) dashboard form; (4) pasted webpage URL.

Normalize each submission into a standard record. Required fields: project ID;
original idea; input source; source reference; brand, if known; submission
time; submitter; processing status.

For voice notes, transcribe the audio before analysis. For URLs, retrieve
accessible page content, extract relevant text, and retain the source URL.

Treat imported content as untrusted input. Never allow instructions inside an
external webpage to override system instructions or trigger unauthorized
actions.

### Stage 2: Analyze the idea
Classify: topic; content objective; intended audience; proposed format; brand
relevance; language; platform suitability; missing information; potential
factual claims requiring verification. Load the selected brand configuration
before deciding which questions are necessary. Save the analysis as structured
JSON, not just free-form prose.

### Stage 3: Generate the questionnaire
Generate the complete relevant questionnaire in one operation. Each question
contains: stable question ID; label; explanation; input type; required flag;
default value, if applicable; available options; conditional display rule;
validation rule; question group. Avoid asking questions already answered by
the idea or saved brand settings. Save the questionnaire version and wait for
the user to submit answers.

### Stage 4: Validate answers and prepare the brief
1. Validate required fields.
2. Resolve brand defaults.
3. Detect contradictory answers.
4. Identify missing essential facts.
5. Ask for clarification only when necessary.
6. Create the approved production brief.

Do not begin script generation until all required information is available.

### Stage 5: Generate the script
Use the approved brief and the relevant brand rules.

- **Video:** opening hook; scene-by-scene timing; voiceover; on-screen copy;
  camera and motion direction; visual descriptions; transitions; sound
  direction; closing CTA.
- **Carousel:** cover slide; slide-by-slide narrative; headline and supporting
  text; visual direction; final CTA slide.
- **Static post:** headline; body copy; visual composition; caption; CTA.

Store each generated script as an immutable version.

### Stage 6: Script approval
Actions: approve; request changes; edit and save; regenerate selected
sections; reject or cancel. Approval must reference the exact script version
and content hash. If changes are requested, retain the old version and create
a new one.

### Stage 7: Generate the creative source
Create a production specification including: approved script version; brand
configuration version; aspect ratio and dimensions; template or visual style;
scene or slide definitions; typography; colors; assets and reference images;
animation timing; export requirements.

Claude Code works inside a controlled project workspace or isolated worker.
Save source files in a GitHub repository; store large media separately.
Illustrative project directory:

```
content-project/
  content-spec.json
  script.json
  scenes/
  src/
    index.html
    styles.css
    main.js
  assets/
  render/
    render.js
    validate.js
  package.json
```

Static posts may not require a JavaScript entry point, while Three.js videos
will require scene and rendering code. The generation worker must return a
structured result containing the repository reference, commit or revision,
preview location, and any errors.

### Stage 8: Creative preview and approval
The CRM retrieves the preview from an isolated preview service or a generated
preview asset. The reviewer can: view the creative; switch between versions;
inspect every carousel slide; play the animation preview where supported;
review the script and design settings; request changes; approve the exact
creative version. An approved creative version becomes immutable. Subsequent
edits create another version.

### Stage 9: Render the final media
Render only after the required creative approval.

- **PNG:** open the HTML using Playwright; wait for required fonts and assets;
  capture at the configured dimensions; validate the output.
- **Carousel:** render each slide independently; check slide order and
  consistency; store a manifest listing all files in sequence.
- **Video:** render deterministic frames using a defined timeline; use FFmpeg
  to encode the MP4; validate duration, frame rate, dimensions, audio, and file
  integrity; generate a thumbnail and optionally a contact sheet for review.

Record every render job and its source version.

### Stage 10: Final media approval
Present the actual rendered output, not just the HTML preview. Allow the
reviewer to: approve; request a rerender; return to creative editing; reject
the media; download the output. The approval record must identify the exact
files and creative version being approved. If the creative changes after
rendering, mark the previous render as outdated.

### Stage 11: Publish or schedule
Prepare a publishing package: platform and account; media files; caption;
hashtags; link, if applicable; scheduled publication time; approved asset
version. Verify platform-specific dimensions, media types, account
permissions, and publishing requirements. Submit the publishing job through the
configured integration. Store: external platform post ID; publication URL;
scheduled time; actual publication time; result status; API response or error
details. Do not mark a post as published until the integration confirms
publication.

## 6. Database design

See `docs/DATA_MODEL.md` for the full table list (brands, brand_assets,
content_projects, questionnaires, questionnaire_answers, content_briefs,
scripts, creative_versions, render_jobs, media_assets, approvals,
publishing_jobs, workflow_jobs, workflow_events). Use UUID primary keys,
foreign keys, appropriate indexes, and database constraints. Add created and
updated timestamps consistently. Store large files in Supabase Storage; keep
storage paths and metadata in Postgres.

## 7. Workflow orchestration in n8n

Build separate workflows rather than one enormous workflow: A Intake, B Analyze
and question, C Answer submission, D Script generation, E Creative generation,
F Rendering, G Publishing. Details in `docs/WORKFLOW.md §4`. Use durable
database state for workflow recovery. n8n executions should not be the only
record of project progress.

## 8. Backend API contracts

Logical endpoints (to be implemented and documented — see `docs/API.md`):

- `POST /api/content-projects`
- `POST /api/imports/csv`
- `POST /api/webhooks/telegram`
- `POST /api/content-projects/{id}/analyze`
- `POST /api/content-projects/{id}/questionnaire/submit`
- `POST /api/content-projects/{id}/scripts/generate`
- `POST /api/approvals`
- `POST /api/content-projects/{id}/creative/generate`
- `POST /api/render-jobs`
- `GET /api/render-jobs/{id}`
- `POST /api/publishing-jobs`

Use authenticated requests, strict authorization, payload validation, rate
limits, and idempotency keys where operations may be retried.

## 9. Connecting GitHub, Claude Code, and Supabase

The production worker should:

1. Receive a job containing project ID, approved script version, brand configuration version, and generation requirements.
2. Create or select an isolated working directory.
3. Check out the designated repository and branch.
4. Supply the structured production specification to Claude Code.
5. Run code-quality checks and rendering tests.
6. Commit generated source files and record the commit SHA.
7. Generate a preview in a sandbox.
8. Upload preview and output assets to storage.
9. Update the database with source and asset references.
10. Return the job result to the workflow orchestrator.

Do not let Claude Code directly approve its own work or publish without
authorization. Do not allow a generated creative to access database
credentials, environment secrets, or unrestricted internal network resources.
Keep source files, generated media, and approval metadata linked to the same
project and version.

## 10. Approval and revision rules

- Script approval applies only to the approved script version.
- Creative approval applies only to the approved creative version.
- Final media approval applies only to the exact rendered files.
- Publishing must use the approved media manifest.
- A new revision must not overwrite the previous approved artifact.
- Requesting changes returns the project to the appropriate editing stage.
- Any downstream output generated from a superseded version must be marked outdated.
- All approval decisions must include reviewer, timestamp, artifact ID, and version.
- The system must preserve a history of revisions and decisions.

## 11. Security and reliability

- Enable Row Level Security on tables exposed to the frontend.
- Store integration credentials in server-side secrets.
- Never expose service-role keys or API tokens in browser code or generated creatives.
- Validate and sanitize imported data.
- Isolate HTML and JavaScript previews on a separate origin or sandbox.
- Restrict rendering-worker network access and execution permissions.
- Validate generated source code before executing it.
- Limit file size, rendering duration, memory use, and worker concurrency.
- Use checksums to identify duplicate files and detect unexpected changes.
- Use idempotency keys for rendering and publishing operations.
- Retry transient failures with backoff.
- Require manual intervention for permanent errors or repeated failures.
- Keep audit records for workflow transitions and approval decisions.
- Support cancellation and safe recovery of incomplete jobs.

## 12. Release scope

**Initial release (must have):** brand configuration; manual idea submission;
CSV import; Telegram text and URL intake; dynamic questionnaire; script
generation and approval; Claude Code/GitHub creative workflow; isolated HTML
preview; PNG and carousel rendering; media library; versioned approvals;
manual download and publishing preparation.

**Second release:** automated video rendering; Telegram voice-note
transcription; automated Buffer scheduling and publishing; publishing error
handling; calendar view; additional platform integrations.

**Later enhancements:** multi-user teams and client workspaces; performance
analytics; content recommendations based on results; automated repurposing
across formats and languages; reusable template marketplace; advanced campaign
planning.

## 13. Acceptance criteria (initial system)

Ready for production testing when:

- An idea submitted from every supported intake channel creates a project.
- CSV imports report successful, failed, and duplicate rows.
- The AI generates a valid questionnaire using the correct brand settings.
- The project waits for submitted answers before script generation.
- Missing required answers prevent progression.
- Script versions can be edited and approved independently.
- Creative source files can be traced to their GitHub revision.
- The CRM displays the corresponding preview and media assets.
- PNGs and carousel slides render at the configured dimensions.
- Rendered files are validated before final approval.
- An approved artifact cannot silently change without a new version.
- Publishing cannot proceed without the required approval.
- A failed job can be retried without creating duplicate projects or posts.
- All critical state transitions and approval decisions are auditable.
- Credentials and generated code are isolated appropriately.

## 14. Recommended implementation order

1. Database, authentication, brand settings, dashboard, and intake.
2. Questionnaire engine, structured brief, script generation, and approvals.
3. GitHub integration, isolated preview environment, Claude Code worker, and creative versioning.
4. PNG rendering, carousel rendering, media library, and final approval.
5. Video rendering, FFmpeg validation, and resumable render jobs.
6. Publishing integration, scheduling, retries, and status monitoring.

Do not implement all six phases simultaneously. Finish and test each phase
before adding the next.

## Final architectural decision

Use Supabase as the system of record, Lovable for the CRM interface, n8n for
workflow orchestration, GitHub for creative source code, Claude Code for source
generation, a separate worker for safe rendering, and Supabase Storage for
final media.

The CRM must own the project state and approvals. Claude Code and the
rendering worker produce artifacts; they do not control the business workflow
or decide whether content is approved.
