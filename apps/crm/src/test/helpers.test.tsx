import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/StatusBadge";
import { decodeCsvBytes, guessMapping, previewCsv } from "@/features/inbox/csv-mapping";
import { parseTags } from "@/features/inbox/NewIdeaDialog";
import { eventLabel } from "@/features/projects/event-label";
import { formatBytes, textDir } from "@/lib/format";
import { I18nProvider } from "@/lib/i18n";
import type { WorkflowEvent } from "@/types/db";

describe("CSV mapping", () => {
  it("guesses English and Arabic headers", () => {
    expect(guessMapping(["Idea", "Link", "Brand Name", "Tags", "Format"])).toEqual({
      idea: "Idea",
      url: "Link",
      brand: "Brand Name",
      tags: "Tags",
      content_type: "Format",
    });
    expect(guessMapping(["الفكرة", "الرابط", "العلامة", "اللغة"])).toEqual({
      idea: "الفكرة",
      url: "الرابط",
      brand: "العلامة",
      language: "اللغة",
    });
  });

  it("never maps one column to two fields", () => {
    const m = guessMapping(["text", "description"]);
    expect(m).toEqual({ idea: "text" });
  });

  it("decodes Windows-1256 like the server and previews rows", () => {
    const bytes = new Uint8Array([0x69, 0x64, 0x65, 0x61, 0x0a, 0xe3, 0xd1, 0xcd, 0xc8, 0xc7]);
    const text = decodeCsvBytes(bytes.buffer);
    expect(previewCsv(text)).toEqual({ headers: ["idea"], rows: [["مرحبا"]] });
  });
});

describe("helpers", () => {
  it("parses tags with Latin and Arabic commas", () => {
    expect(parseTags("ramadan, offers،  offers ;launch")).toEqual(["ramadan", "offers", "launch"]);
  });

  it("detects text direction from the first letter", () => {
    expect(textDir("عرض رمضان 2026")).toBe("rtl");
    expect(textDir("2026 Ramadan offer")).toBe("ltr");
    expect(textDir("123")).toBe("auto");
  });

  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(null)).toBe("—");
  });

  it("labels audit events in both languages", () => {
    const e: WorkflowEvent = {
      id: "1",
      project_id: "p",
      workflow_job_id: null,
      event_type: "status.changed",
      event_data: { from: "new", to: "analyzing" },
      actor_id: null,
      created_at: new Date().toISOString(),
    };
    expect(eventLabel(e, "en")).toBe("Status: New → Analyzing");
    expect(eventLabel(e, "ar")).toBe("الحالة: جديد ← قيد التحليل");
    expect(eventLabel({ ...e, event_type: "something.unknown" }, "en")).toBe("something.unknown");
  });
});

describe("StatusBadge", () => {
  it("renders the translated status and marks working states", () => {
    render(
      <I18nProvider defaultLocale="en">
        <StatusBadge status="analyzing" />
        <StatusBadge status="script_in_review" />
      </I18nProvider>,
    );
    expect(screen.getByText("Analyzing").closest("[data-status]")).toHaveAttribute(
      "data-status",
      "analyzing",
    );
    expect(screen.getByText("Script in review")).toBeInTheDocument();
  });
});
