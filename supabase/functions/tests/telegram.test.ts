import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { createTelegramHandler } from "../telegram-webhook/handler.ts";
import { addMember, createUser, makeDeps, sql, TG_SECRET, unique } from "./helpers.ts";

let updateId = Math.floor(Math.random() * 1e9);
let tgUserId = Math.floor(Math.random() * 1e9);

function update(from: number, message: Record<string, unknown>) {
  return {
    update_id: ++updateId,
    message: {
      message_id: updateId,
      date: 1761700000,
      chat: { id: from, type: "private" },
      from: { id: from },
      ...message,
    },
  };
}

function post(handler: (r: Request) => Promise<Response>, body: unknown, secret = TG_SECRET) {
  return handler(
    new Request("http://localhost/telegram-webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret },
      body: JSON.stringify(body),
    }),
  );
}

Deno.test("telegram webhook", async (t) => {
  const deps = makeDeps();
  const handler = createTelegramHandler(deps);
  const user = await createUser("tg");
  const tgId = ++tgUserId;

  await t.step("rejects requests without the secret token", async () => {
    const res = await post(handler, update(tgId, { text: "hi" }), "wrong");
    assertEquals(res.status, 401);
  });

  await t.step("unlinked users get linking instructions", async () => {
    const res = await post(handler, update(tgId, { text: "my idea" }));
    const body = await res.json();
    assertEquals(body.method, "sendMessage");
    assertStringIncludes(body.text, "/link");
  });

  await t.step("/link <code> connects the account", async () => {
    const [{ code }] =
      (await sql`select public.create_telegram_link_code(${user.id}) as code`) as unknown as [
        { code: string },
      ];
    const res = await post(handler, update(tgId, { text: `/link ${code}` }));
    assertStringIncludes((await res.json()).text, "Connected");
    const [p] = await sql`select telegram_user_id from public.profiles where id = ${user.id}`;
    assertEquals(Number(p!.telegram_user_id), tgId);
  });

  let projectId = "";
  await t.step("text becomes a project; replayed update creates nothing new", async () => {
    const u = update(tgId, {
      text: `Idea about our Ramadan menu ${unique()} https://example.com/menu`,
    });
    const res = await post(handler, u);
    const body = await res.json();
    assertStringIncludes(body.text, "https://crm.test/projects/");
    projectId = body.text.match(/projects\/([0-9a-f-]{36})/)[1];
    const [p] = await sql`select input_source, source_url, original_idea, source_idempotency_key
                          from public.content_projects where id = ${projectId}`;
    assertEquals(p!.input_source, "telegram");
    assertEquals(p!.source_url, "https://example.com/menu");
    assert(!String(p!.original_idea).includes("https://"));
    assertEquals(p!.source_idempotency_key, `telegram:${u.update_id}`);

    const again = await (await post(handler, u)).json();
    assertStringIncludes(again.text, projectId);
    const [{ n }] =
      (await sql`select count(*)::int as n from public.content_projects where source_idempotency_key = ${`telegram:${u.update_id}`}`) as unknown as [
        { n: number },
      ];
    assertEquals(n, 1);
  });

  await t.step("a bare link is an url intake", async () => {
    const res = await post(
      handler,
      update(tgId, { text: `https://example.com/only-link-${unique()}` }),
    );
    const id = (await res.json()).text.match(/projects\/([0-9a-f-]{36})/)[1];
    const [p] = await sql`select input_source from public.content_projects where id = ${id}`;
    assertEquals(p!.input_source, "url");
  });

  await t.step("voice notes are declined for now", async () => {
    const res = await post(handler, update(tgId, { voice: { file_id: "v1", duration: 3 } }));
    assertStringIncludes((await res.json()).text, "Voice notes");
  });

  await t.step("Arabic users get Arabic replies", async () => {
    await sql`update public.profiles set locale = 'ar' where id = ${user.id}`;
    const res = await post(handler, update(tgId, { text: `فكرة جديدة ${unique()}` }));
    assertStringIncludes((await res.json()).text, "تم حفظ الفكرة");
  });

  await t.step("reviewers cannot submit", async () => {
    const reviewer = await createUser("tg-reviewer");
    // Make the reviewer's first workspace one where they are only a reviewer.
    await sql`delete from public.workspace_members where user_id = ${reviewer.id}`.catch(() => {});
    const rid = ++tgUserId;
    await sql`update public.profiles set telegram_user_id = ${rid} where id = ${reviewer.id}`;
    await addMember(user.workspaceId, reviewer.id, "reviewer");
    const res = await post(handler, update(rid, { text: `idea ${unique()}` }));
    const text = (await res.json()).text as string;
    assert(text.includes("role") || text.includes("صلاحيتك"), text);
  });

  await t.step("group chats are ignored", async () => {
    const u = update(tgId, { text: "x" });
    (u.message.chat as { type: string }).type = "group";
    const res = await post(handler, u);
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "");
  });
});

Deno.test({ name: "close db", sanitizeOps: false, sanitizeResources: false, fn: () => sql.end() });
