/**
 * Signed `notify` webhook to n8n (n8n/README.md "Calling convention"), so
 * workers announce creative_ready / media_ready / needs_attention like the
 * Edge Functions do. A failed or unconfigured notification never fails a job.
 */
import { createHmac } from "node:crypto";

export type NotifyEvent = "creative_ready" | "media_ready" | "needs_attention";

export type Notifier = (
  event: NotifyEvent,
  job: { job_id: string; project_id: string; stage: string },
) => Promise<boolean>;

export function n8nNotifier(baseUrl: string | null, secret: string | null): Notifier {
  return async (event, job) => {
    if (!baseUrl || !secret) return false;
    const body = JSON.stringify({ ...job, event });
    const ts = Math.floor(Date.now() / 1000);
    const sig = createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/webhook/cc/notify`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-cc-timestamp": String(ts),
          "x-cc-signature": `sha256=${sig}`,
        },
        body,
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  };
}
