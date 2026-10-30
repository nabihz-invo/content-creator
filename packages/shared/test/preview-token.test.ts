import { describe, expect, it } from "vitest";
import { previewCsp, signPreviewToken, verifyPreviewToken } from "../src/preview-token.ts";

const prefix = "11111111-2222-3333-4444-555555555555/creative-v2/";

describe("preview tokens", () => {
  it("round-trips and expires", async () => {
    const t = await signPreviewToken("s3cret", { p: prefix, e: 2000 });
    expect(await verifyPreviewToken("s3cret", t, 1999)).toEqual({ p: prefix, e: 2000 });
    expect(await verifyPreviewToken("s3cret", t, 2001)).toBeNull();
  });
  it("rejects forged signatures and tampered claims", async () => {
    const t = await signPreviewToken("s3cret", { p: prefix, e: 2000 });
    expect(await verifyPreviewToken("other", t, 1000)).toBeNull();
    const [, sig] = t.split(".");
    const tampered = `${btoa(JSON.stringify({ p: "other/creative-v1/", e: 2000 })).replace(/=+$/, "")}.${sig}`;
    expect(await verifyPreviewToken("s3cret", tampered, 1000)).toBeNull();
    expect(await verifyPreviewToken("s3cret", "garbage", 1000)).toBeNull();
  });
  it("only signs creative-version prefixes", async () => {
    await expect(signPreviewToken("s", { p: "../../etc/", e: 1 })).rejects.toThrow();
  });
  it("CSP blocks the network and limits framing to the CRM", () => {
    const csp = previewCsp(["https://crm.example"]);
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("frame-ancestors https://crm.example");
    expect(previewCsp([])).toContain("frame-ancestors 'none'");
  });
});
