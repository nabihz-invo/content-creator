import { assert, assertEquals } from "@std/assert";
import { createApp } from "../api/app.ts";
import { signBody } from "../_shared/n8n.ts";
import type { Questionnaire } from "../_shared/vendor/src/questionnaire.ts";
import { suggestedAnswers } from "../_shared/vendor/src/questionnaire.ts";
import { addMember, authed, createUser, makeDeps, N8N_SECRET, sql, unique } from "./helpers.ts";

const BASE = "http://localhost/api";

async function setup(idea: string) {
  const deps = makeDeps();
  const app = createApp(deps);
  const admin = await createUser("p2admin");
  const reviewer = await createUser("p2reviewer");
  await addMember(admin.workspaceId, reviewer.id, "reviewer");
  const [brand] =
    await sql`insert into public.brands (workspace_id, name, default_language, brand_settings)
    values (${admin.workspaceId}, ${`Noor ${unique()}`}, 'ar',
            ${sql.json({ voice: { tone: "Warm" }, palette: [{ name: "Saffron", hex: "#E8A33D", role: "accent" }], cta: { default: "زورونا" } })})
    returning id`;
  const res = await app.request(
    `${BASE}/content-projects`,
    authed(admin.id, {
      method: "POST",
      json: { original_idea: `${idea} ${unique()}`, brand_id: brand!.id },
    }),
  );
  const project = await res.json();

  const runJob = async (jobId: string) => {
    const body = JSON.stringify({ job_id: jobId });
    const ts = Math.floor(Date.now() / 1000);
    const r = await app.request(`${BASE}/internal/run-job`, {
      method: "POST",
      headers: {
        "x-cc-timestamp": String(ts),
        "x-cc-signature": `sha256=${await signBody(N8N_SECRET, ts, body)}`,
      },
      body,
    });
    return { status: r.status, body: await r.json() };
  };
  const status = async () =>
    (
      await sql`select status::text from public.content_projects where id = ${project.project_id}`
    )[0]!.status as string;
  const lastDispatch = (workflow: string) =>
    [...deps.dispatched].reverse().find((d) => d.workflow === workflow)!.job;
  const post = (userId: string, path: string, json: unknown) =>
    app.request(`${BASE}${path}`, authed(userId, { method: "POST", json }));
  return { deps, app, admin, reviewer, project, runJob, status, lastDispatch, post };
}

Deno.test(
  "Phase 2 pipeline: AI configuration → approval → brief → script → review → approval",
  async (t) => {
    const s = await setup("A 3D motion video announcing our winter offer");
    const pid = s.project.project_id as string;
    let q: { id: string; questions: Questionnaire };

    await t.step("analysis proposes a configuration the user reviews", async () => {
      const r = await s.runJob(s.project.job_id);
      assertEquals(r.body.outcome, "succeeded");
      assertEquals(await s.status(), "awaiting_answers");
      [q] =
        (await sql`select id, questions from public.questionnaires where project_id = ${pid} and status = 'awaiting_answers'`) as unknown as [
          typeof q,
        ];
      const byId = Object.fromEntries(q.questions.questions.map((x) => [x.id, x]));
      assertEquals(byId.q_format!.suggested?.value, "video");
      assertEquals(byId.q_accent_color!.suggested, {
        value: "#e8a33d",
        rationale: { en: "From the brand settings.", ar: "من إعدادات العلامة التجارية." },
        confidence: "high",
        source: "brand",
      });
      assert(byId.q_custom_offer_end_date, "a custom question asks for the missing offer date");
      assertEquals(s.deps.dispatched.at(-1)!.job.event, "configuration_ready");
    });

    await t.step("replayed run-job is a no-op", async () => {
      const r = await s.runJob(s.project.job_id);
      assertEquals(r.body.outcome, "skipped");
    });

    await t.step("draft saves; incomplete or unauthorized approval is refused", async () => {
      const answers = suggestedAnswers(q.questions);
      let res = await s.post(s.admin.id, `/content-projects/${pid}/questionnaire/submit`, {
        questionnaire_id: q.id,
        answers,
        draft: true,
      });
      assertEquals(res.status, 200);
      res = await s.post(s.admin.id, `/content-projects/${pid}/questionnaire/submit`, {
        questionnaire_id: q.id,
        answers,
      });
      assertEquals(res.status, 422, "the custom offer-date question is still unanswered");
      const err = await res.json();
      assertEquals(err.error.details.fields.q_custom_offer_end_date, "required");
      assertEquals(await s.status(), "awaiting_answers", "status unchanged");
      res = await s.post(s.reviewer.id, `/content-projects/${pid}/questionnaire/submit`, {
        questionnaire_id: q.id,
        answers: { ...answers, q_custom_offer_end_date: "End of Ramadan" },
      });
      assertEquals(res.status, 403);
    });

    await t.step("approving the configuration runs the brief, then the script", async () => {
      const answers = {
        ...suggestedAnswers(q.questions),
        q_custom_offer_end_date: "End of Ramadan",
        q_hook: { ai_decide: true },
        q_duration: "15",
      };
      const res = await s.post(s.admin.id, `/content-projects/${pid}/questionnaire/submit`, {
        questionnaire_id: q.id,
        answers,
      });
      const body = await res.json();
      assertEquals(res.status, 202, JSON.stringify(body));
      assertEquals(body.status, "validating_answers");
      assertEquals(s.lastDispatch("answers").job_id, body.job_id);
      const approval =
        await sql`select stage::text, artifact_hash from public.approvals where project_id = ${pid}`;
      assertEquals(approval[0]!.stage, "config");
      assertEquals(approval[0]!.artifact_hash, body.content_hash);

      const brief = await s.runJob(body.job_id);
      assertEquals(brief.body.outcome, "succeeded");
      assertEquals(await s.status(), "generating_script");
      const [b] =
        await sql`select brief from public.content_briefs where project_id = ${pid} and status = 'current'`;
      assertEquals(b!.brief.content_type, "video");
      assertEquals(b!.brief.duration_seconds, 15, "approved duration wins over the AI brief");
      assertEquals(b!.brief.visual.accent_color, "#e8a33d");

      const script = await s.runJob(s.lastDispatch("script").job_id);
      assertEquals(script.body.outcome, "succeeded");
      assertEquals(await s.status(), "script_in_review");
      assertEquals(s.deps.dispatched.at(-1)!.job.event, "script_ready");
    });

    let v1: { id: string; version: number; content_hash: string; content: Record<string, unknown> };
    await t.step("stale hash is rejected; changes requested produce v2", async () => {
      [v1] =
        (await sql`select id, version, content_hash, content from public.scripts where project_id = ${pid} and status = 'in_review'`) as unknown as [
          typeof v1,
        ];
      let res = await s.post(s.reviewer.id, "/approvals", {
        artifact_type: "script",
        artifact_id: v1.id,
        artifact_version: 1,
        artifact_hash: "0".repeat(64),
        decision: "approved",
      });
      assertEquals(res.status, 409);
      assertEquals((await res.json()).error.code, "hash_mismatch");
      res = await s.post(s.reviewer.id, "/approvals", {
        artifact_type: "script",
        artifact_id: v1.id,
        artifact_version: 1,
        artifact_hash: v1.content_hash,
        decision: "changes_requested",
        comment: "Make the hook punchier",
      });
      assertEquals(res.status, 201);
      assertEquals(await s.status(), "generating_script");
      const r = await s.runJob(s.lastDispatch("script").job_id);
      assertEquals(r.body.outcome, "succeeded");
      const [v2] =
        await sql`select version, content from public.scripts where project_id = ${pid} and status = 'in_review'`;
      assertEquals(v2!.version, 2);
      assert(String(v2!.content.title).includes("(v2)"), "revision saw the previous version");
    });

    await t.step("manual edit is validated and creates v3; reviewers cannot edit", async () => {
      const [v2] =
        (await sql`select id, content from public.scripts where project_id = ${pid} and status = 'in_review'`) as unknown as [
          { id: string; content: Record<string, unknown> },
        ];
      const broken = structuredClone(v2.content) as { scenes: { end_s: number }[] };
      broken.scenes[0]!.end_s += 1;
      let res = await s.post(s.admin.id, `/content-projects/${pid}/scripts`, {
        base_script_id: v2.id,
        content: broken,
      });
      assertEquals(res.status, 422);
      assert(JSON.stringify(await res.json()).includes("contiguous"));
      res = await s.post(s.reviewer.id, `/content-projects/${pid}/scripts`, {
        base_script_id: v2.id,
        content: { ...v2.content, caption: "edited" },
      });
      assertEquals(res.status, 403);
      res = await s.post(s.admin.id, `/content-projects/${pid}/scripts`, {
        base_script_id: v2.id,
        content: { ...v2.content, caption: "Edited caption" },
      });
      assertEquals(res.status, 201);
      assertEquals((await res.json()).version, 3);
    });

    await t.step("approving v3 queues the creative worker, not n8n", async () => {
      const [v3] =
        (await sql`select id, version, content_hash from public.scripts where project_id = ${pid} and status = 'in_review'`) as unknown as [
          typeof v1,
        ];
      const before = s.deps.dispatched.length;
      const res = await s.post(s.reviewer.id, "/approvals", {
        artifact_type: "script",
        artifact_id: v3.id,
        artifact_version: v3.version,
        artifact_hash: v3.content_hash,
        decision: "approved",
      });
      assertEquals(res.status, 201);
      assertEquals(await s.status(), "generating_creative");
      const [job] =
        await sql`select id, kind::text from public.workflow_jobs where project_id = ${pid} and stage = 'creative' and status = 'queued'`;
      assertEquals(job!.kind, "creative_worker");
      assertEquals(s.deps.dispatched.length, before, "nothing is sent to n8n for worker jobs");
      const r = await s.runJob(job!.id);
      assertEquals(r.body.accepted, false, "run-job never executes worker jobs");
      const [{ n }] =
        (await sql`select count(*)::int as n from public.workflow_events where project_id = ${pid} and event_type = 'status.changed'`) as unknown as [
          { n: number },
        ];
      assert(n >= 9, `full audit trail (${n} status changes)`);
    });
  },
);

Deno.test("clarification round and recovery", async (t) => {
  const s = await setup("[clarify] Event poster for our opening");
  const pid = s.project.project_id as string;
  await s.runJob(s.project.job_id);
  const [q] =
    (await sql`select id, questions from public.questionnaires where project_id = ${pid}`) as unknown as [
      { id: string; questions: Questionnaire },
    ];
  const res = await s.post(s.admin.id, `/content-projects/${pid}/questionnaire/submit`, {
    questionnaire_id: q.id,
    answers: suggestedAnswers(q.questions),
  });
  const submitted = await res.json();
  assertEquals(res.status, 202, JSON.stringify(submitted));
  const { job_id } = submitted;

  await t.step("the brief asks one essential question", async () => {
    await s.runJob(job_id);
    assertEquals(await s.status(), "needs_clarification");
    const [c] =
      await sql`select id, questions from public.questionnaires where project_id = ${pid} and kind = 'clarification'`;
    assertEquals(
      c!.questions.questions.map((x: { id: string }) => x.id),
      ["q_custom_target_city"],
    );
    assertEquals(s.deps.dispatched.at(-1)!.job.event, "clarification_needed");
    const r2 = await s.post(s.admin.id, `/content-projects/${pid}/questionnaire/submit`, {
      questionnaire_id: c!.id,
      answers: { q_custom_target_city: "Riyadh" },
    });
    assertEquals(r2.status, 202);
    await s.runJob((await r2.json()).job_id);
    assertEquals(await s.status(), "generating_script");
  });

  await t.step("recover re-dispatches a job whose delivery was lost", async () => {
    const [job] =
      await sql`update public.workflow_jobs set next_run_at = now() - interval '10 minutes'
      where project_id = ${pid} and stage = 'script' and status = 'queued' returning id`;
    const before = s.deps.dispatched.length;
    const body = "{}";
    const ts = Math.floor(Date.now() / 1000);
    const r = await s.app.request(`${BASE}/internal/recover`, {
      method: "POST",
      headers: {
        "x-cc-timestamp": String(ts),
        "x-cc-signature": `sha256=${await signBody(N8N_SECRET, ts, body)}`,
      },
      body,
    });
    assertEquals(r.status, 200);
    assert((await r.json()).redispatched >= 1);
    assert(s.deps.dispatched.slice(before).some((d) => d.job.job_id === job!.id));
  });

  await t.step("analysis can be re-run while the configuration is unapproved only", async () => {
    const r = await s.post(s.admin.id, `/content-projects/${pid}/analyze`, {});
    assertEquals(r.status, 409);
  });
});

Deno.test({ name: "close db", sanitizeOps: false, sanitizeResources: false, fn: () => sql.end() });
