// Generates n8n/workflows/*.json (importable with `n8n import:workflow`).
// Workflows are thin by design (ADR-0006): the stage logic lives in the `api` Edge Function.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "../workflows");

const verifyAndSign = `// Verify the Edge Function's HMAC (n8n/README.md), then sign the call to run-job.
const crypto = require('crypto');
const secret = $env.N8N_WEBHOOK_SECRET;
if (!secret) throw new Error('N8N_WEBHOOK_SECRET is not set');
const item = $input.first().json;
const raw = JSON.stringify(item.body); // sender uses compact JSON.stringify; key order is preserved
const ts = Number(item.headers['x-cc-timestamp']);
const given = String(item.headers['x-cc-signature'] || '').replace(/^sha256=/, '');
const expected = crypto.createHmac('sha256', secret).update(ts + '.' + raw).digest('hex');
const fresh = Math.abs(Date.now() / 1000 - ts) <= 300;
if (!fresh || given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
  throw new Error('invalid or expired signature');
}
const body = JSON.stringify({ job_id: item.body.job_id });
const now = Math.floor(Date.now() / 1000);
return [{ json: {
  workflow: item.params.workflow,
  job: item.body,
  body,
  timestamp: String(now),
  signature: 'sha256=' + crypto.createHmac('sha256', secret).update(now + '.' + body).digest('hex'),
} }];`;

const notifyText = `// Builds the Telegram message for a pipeline event in the owner's language.
const t = $input.first().json;
const event = $('Verify signature').first().json.job.event;
if (!t.telegram_user_id) return []; // owner hasn't linked Telegram
const link = ($env.CC_CRM_URL || '').replace(/\\/$/, '') + '/projects/' + t.project_id;
const M = {
  configuration_ready: { en: '✨ AI configuration ready for review', ar: '✨ الإعدادات المقترحة جاهزة للمراجعة' },
  clarification_needed: { en: '❓ A few details are needed', ar: '❓ نحتاج بعض التفاصيل' },
  script_ready: { en: '📝 Script ready for review', ar: '📝 النص جاهز للمراجعة' },
  creative_ready: { en: '🎨 Creative ready for review', ar: '🎨 التصميم جاهز للمراجعة' },
  media_ready: { en: '🖼️ Final media ready for approval', ar: '🖼️ الملفات النهائية جاهزة للاعتماد' },
  needs_attention: { en: '⚠️ A step needs your attention', ar: '⚠️ خطوة تحتاج انتباهك' },
};
const m = M[event];
if (!m) return [];
const lang = t.locale === 'ar' ? 'ar' : 'en';
return [{ json: { chat_id: String(t.telegram_user_id), text: m[lang] + '\\n«' + t.title + '»\\n' + link } }];`;

const signRecover = `const crypto = require('crypto');
const secret = $env.N8N_WEBHOOK_SECRET;
if (!secret) throw new Error('N8N_WEBHOOK_SECRET is not set');
const body = '{}';
const now = Math.floor(Date.now() / 1000);
return [{ json: { body, timestamp: String(now), signature: 'sha256=' + crypto.createHmac('sha256', secret).update(now + '.' + body).digest('hex') } }];`;

const signedPost = (name, path, position) => ({
  parameters: {
    method: "POST",
    url: `={{ $env.CC_SUPABASE_URL }}/functions/v1/api/internal/${path}`,
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: "content-type", value: "application/json" },
        { name: "x-cc-timestamp", value: "={{ $json.timestamp }}" },
        { name: "x-cc-signature", value: "={{ $json.signature }}" },
      ],
    },
    sendBody: true,
    contentType: "raw",
    rawContentType: "application/json",
    body: "={{ $json.body }}",
    options: { timeout: 30000 },
  },
  name,
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position,
  retryOnFail: true,
  maxTries: 3,
  waitBetweenTries: 5000,
});

const stageRunner = {
  name: "CC — Stage runner + notifications",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "cc/:workflow",
        responseMode: "onReceived",
        options: {},
      },
      name: "Job webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [0, 300],
      webhookId: "6f0a3c9e-cc00-4c6b-9a51-1c2d3e4f5a6b",
    },
    {
      parameters: { jsCode: verifyAndSign },
      name: "Verify signature",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [220, 300],
    },
    {
      parameters: {
        conditions: {
          string: [{ value1: "={{ $json.workflow }}", operation: "equal", value2: "notify" }],
        },
      },
      name: "Is notification?",
      type: "n8n-nodes-base.if",
      typeVersion: 1,
      position: [440, 300],
    },
    signedPost("Run job (Edge Function)", "run-job", [680, 400]),
    {
      parameters: {
        method: "POST",
        url: "={{ $env.CC_SUPABASE_URL }}/rest/v1/rpc/notification_target",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "supabaseApi",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ p_project_id: $json.job.project_id }) }}",
        options: {},
      },
      name: "Who to notify",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [680, 200],
      credentials: { supabaseApi: { id: "cc-supabase-service", name: "cc-supabase-service" } },
    },
    {
      parameters: { jsCode: notifyText },
      name: "Compose message",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [900, 200],
    },
    {
      parameters: {
        chatId: "={{ $json.chat_id }}",
        text: "={{ $json.text }}",
        additionalFields: { disable_web_page_preview: true },
      },
      name: "Send Telegram",
      type: "n8n-nodes-base.telegram",
      typeVersion: 1.2,
      position: [1120, 200],
      credentials: { telegramApi: { id: "cc-telegram-bot", name: "cc-telegram-bot" } },
    },
  ],
  connections: {
    "Job webhook": { main: [[{ node: "Verify signature", type: "main", index: 0 }]] },
    "Verify signature": { main: [[{ node: "Is notification?", type: "main", index: 0 }]] },
    "Is notification?": {
      main: [
        [{ node: "Who to notify", type: "main", index: 0 }],
        [{ node: "Run job (Edge Function)", type: "main", index: 0 }],
      ],
    },
    "Who to notify": { main: [[{ node: "Compose message", type: "main", index: 0 }]] },
    "Compose message": { main: [[{ node: "Send Telegram", type: "main", index: 0 }]] },
  },
  settings: { executionOrder: "v1" },
  active: false,
};

const recovery = {
  name: "CC — Recovery (Workflow R)",
  nodes: [
    {
      parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 5 }] } },
      name: "Every 5 minutes",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.2,
      position: [0, 300],
    },
    {
      parameters: { jsCode: signRecover },
      name: "Sign request",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [220, 300],
    },
    signedPost("Recover jobs (Edge Function)", "recover", [440, 300]),
  ],
  connections: {
    "Every 5 minutes": { main: [[{ node: "Sign request", type: "main", index: 0 }]] },
    "Sign request": { main: [[{ node: "Recover jobs (Edge Function)", type: "main", index: 0 }]] },
  },
  settings: { executionOrder: "v1" },
  active: false,
};

export const WORKFLOWS = { "stage-runner.json": stageRunner, "recovery.json": recovery };
export const serialize = (wf) => JSON.stringify(wf, null, 2) + "\n";
export { out as WORKFLOWS_DIR };

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [file, wf] of Object.entries(WORKFLOWS)) writeFileSync(join(out, file), serialize(wf));
  console.log("wrote n8n/workflows/stage-runner.json, recovery.json");
}
