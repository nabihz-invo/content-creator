# Prompt templates

Versioned prompt templates (`<name>.v<N>.md`). Never edit a released version:
add `v<N+1>` and point `ai_settings.prompt_version` (or the code default) at it.

Format: `<!-- system -->` and `<!-- user -->` sections; `{{name}}` placeholders
are filled by `renderPrompt()` (missing variables throw). Untrusted content
(ideas, CSV cells, Telegram text, fetched pages) must be passed through
`untrusted()` so it is wrapped in `<untrusted_source>` and cannot close the tag.

`pnpm --filter @cc/shared prompts:build` regenerates
`src/prompts/templates.generated.ts`; a test fails if it is stale.
