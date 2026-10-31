/**
 * Signed job dispatch to n8n (n8n/README.md "Calling convention").
 * Dispatch failures never fail the request: the job row is durable and
 * Workflow R re-dispatches queued jobs that were not picked up.
 */

export interface JobRef {
  job_id: string;
  project_id: string | null;
  stage: string;
  /** For the notify workflow: configuration_ready, clarification_needed, script_ready, creative_ready, media_ready, needs_attention. */
  event?: string;
}

export interface Dispatcher {
  dispatch(workflow: string, job: JobRef): Promise<boolean>;
}

const encoder = new TextEncoder();

export async function signBody(secret: string, timestamp: number, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time verification of an incoming signed request (used by internal endpoints). */
export async function verifySignature(
  secret: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  body: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!timestampHeader || !signatureHeader?.startsWith("sha256=")) return false;
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > 300) return false;
  const expected = await signBody(secret, ts, body);
  const given = signatureHeader.slice("sha256=".length);
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function n8nDispatcher(baseUrl: string | null, secret: string | null): Dispatcher {
  return {
    async dispatch(workflow, job) {
      if (!baseUrl || !secret) {
        console.warn(`n8n not configured; job ${job.job_id} stays queued`);
        return false;
      }
      const body = JSON.stringify(job);
      const ts = Math.floor(Date.now() / 1000);
      try {
        const res = await fetch(`${baseUrl.replace(/\/$/, "")}/webhook/cc/${workflow}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-cc-timestamp": String(ts),
            "x-cc-signature": `sha256=${await signBody(secret, ts, body)}`,
          },
          body,
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) console.warn(`n8n dispatch ${workflow} → ${res.status}`);
        return res.ok;
      } catch (err) {
        console.warn(`n8n dispatch ${workflow} failed`, err);
        return false;
      }
    },
  };
}

/** Maps pipeline stages to n8n workflow slugs. */
export const STAGE_WORKFLOW: Record<string, string> = {
  analysis: "analyze",
  questionnaire: "analyze",
  brief: "answers",
  script: "script",
  creative: "creative",
  render: "render",
  publish: "publish",
  notify: "notify",
};
