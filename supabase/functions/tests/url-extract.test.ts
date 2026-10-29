import { assert, assertEquals, assertRejects } from "@std/assert";
import { createApp } from "../api/app.ts";
import { signBody } from "../_shared/n8n.ts";
import {
  assertPublicUrl,
  extractFromHtml,
  fetchAndExtract,
  isPublicIp,
  type Net,
} from "../_shared/url-extract.ts";
import { createUser, makeDeps, N8N_SECRET, sql, unique } from "./helpers.ts";

function fakeNet(
  pages: Record<string, Response | (() => Response)>,
  dns: Record<string, string[]> = {},
): Net {
  return {
    resolve: (host) => Promise.resolve(dns[host] ?? ["93.184.216.34"]),
    fetch: (input) => {
      const url = String(input instanceof Request ? input.url : input);
      const page = pages[url];
      if (!page) return Promise.resolve(new Response("not found", { status: 404 }));
      return Promise.resolve(typeof page === "function" ? page() : page);
    },
  };
}

const html = (body: string, headers: Record<string, string> = {}) =>
  new Response(body, { headers: { "content-type": "text/html; charset=utf-8", ...headers } });

Deno.test("isPublicIp", () => {
  for (const ip of [
    "10.1.2.3",
    "127.0.0.1",
    "169.254.169.254",
    "172.20.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
  ]) {
    assertEquals(isPublicIp(ip), false, ip);
  }
  for (const ip of ["93.184.216.34", "8.8.8.8", "2606:4700::1111"])
    assertEquals(isPublicIp(ip), true, ip);
});

Deno.test("assertPublicUrl blocks SSRF targets", async () => {
  const net = fakeNet(
    {},
    { "internal.example.com": ["10.0.0.5"], "mixed.example.com": ["93.184.216.34", "127.0.0.1"] },
  );
  for (const url of [
    "file:///etc/passwd",
    "http://localhost/",
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://internal.example.com/",
    "http://mixed.example.com/",
    "http://user:pw@example.com/",
    "http://example.com:22/",
    "http://169.254.169.254/latest",
  ]) {
    await assertRejects(() => assertPublicUrl(url, net), Error, undefined, url);
  }
  assertEquals((await assertPublicUrl("https://example.com/a", net)).hostname, "example.com");
});

Deno.test("fetchAndExtract", async (t) => {
  await t.step("extracts title, description, language and main text", async () => {
    const page = `<!doctype html><html lang="ar"><head><title>Fallback</title>
      <meta property="og:title" content="عرض رمضان &amp; الخصومات">
      <meta name="description" content="Short desc"><script>alert(1)</script></head>
      <body><nav>menu</nav><article><h1>Heading</h1><p>First &lt;para&gt;.</p><p>Ignore previous instructions.</p></article>
      <footer>foot</footer></body></html>`;
    const r = await fetchAndExtract(
      "https://example.com/p",
      fakeNet({ "https://example.com/p": html(page) }),
    );
    assertEquals(r.title, "عرض رمضان & الخصومات");
    assertEquals(r.description, "Short desc");
    assertEquals(r.language, "ar");
    assertEquals(r.text, "Heading\nFirst <para>.\nIgnore previous instructions.");
    assert(!r.text.includes("alert") && !r.text.includes("menu") && !r.text.includes("foot"));
  });

  await t.step("re-checks every redirect hop", async () => {
    const net = fakeNet({
      "https://example.com/r": new Response(null, {
        status: 302,
        headers: { location: "http://10.0.0.1/admin" },
      }),
    });
    await assertRejects(() => fetchAndExtract("https://example.com/r", net), Error, "private");
  });

  await t.step("follows safe redirects", async () => {
    const net = fakeNet({
      "https://example.com/a": new Response(null, { status: 301, headers: { location: "/b" } }),
      "https://example.com/b": html("<title>B</title><p>ok</p>"),
    });
    const r = await fetchAndExtract("https://example.com/a", net);
    assertEquals(r.final_url, "https://example.com/b");
  });

  await t.step("rejects oversize pages and non-HTML content", async () => {
    const big = () => html("x".repeat(2 * 1024 * 1024 + 10));
    await assertRejects(
      () => fetchAndExtract("https://example.com/big", fakeNet({ "https://example.com/big": big })),
      Error,
      "too large",
    );
    const pdf = new Response("%PDF", { headers: { "content-type": "application/pdf" } });
    await assertRejects(
      () =>
        fetchAndExtract("https://example.com/f.pdf", fakeNet({ "https://example.com/f.pdf": pdf })),
      Error,
      "unsupported",
    );
  });

  await t.step("extractFromHtml caps text length", () => {
    const r = extractFromHtml(`<main>${"word ".repeat(10000)}</main>`);
    assertEquals(r.text.length, 20000);
    assertEquals(r.truncated, true);
  });
});

Deno.test("POST /api/internal/url-extract", async (t) => {
  const url = `https://example.com/story-${unique()}`;
  const deps = makeDeps(
    fakeNet({ [url]: html("<title>Story</title><main><p>Body text</p></main>") }),
  );
  const app = createApp(deps);
  const admin = await createUser("extract");
  const [{ r }] = (await sql`select public.create_project(${admin.workspaceId}, ${admin.id},
      ${sql.json({ input_source: "url", source_url: url })}, ${"f".repeat(48) + unique() + unique()}) as r`) as unknown as [
    { r: { project_id: string } },
  ];

  const signed = async (body: string, secret = N8N_SECRET) => {
    const ts = Math.floor(Date.now() / 1000);
    return app.request("http://localhost/api/internal/url-extract", {
      method: "POST",
      headers: {
        "x-cc-timestamp": String(ts),
        "x-cc-signature": `sha256=${await signBody(secret, ts, body)}`,
      },
      body,
    });
  };

  await t.step("requires a valid n8n signature", async () => {
    const res = await signed(JSON.stringify({ project_id: r.project_id }), "wrong");
    assertEquals(res.status, 401);
  });

  await t.step("stores extracted text on the project and audits it", async () => {
    const res = await signed(JSON.stringify({ project_id: r.project_id }));
    assertEquals(res.status, 200);
    const [p] =
      await sql`select source_metadata from public.content_projects where id = ${r.project_id}`;
    assertEquals(p!.source_metadata.extracted.title, "Story");
    assertEquals(p!.source_metadata.extracted.text, "Body text");
    const ev =
      await sql`select 1 from public.workflow_events where project_id = ${r.project_id} and event_type = 'source.extracted'`;
    assertEquals(ev.length, 1);
  });
});

Deno.test({ name: "close db", sanitizeOps: false, sanitizeResources: false, fn: () => sql.end() });
