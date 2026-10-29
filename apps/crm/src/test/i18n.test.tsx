import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { I18nProvider, interpolate, translate, useI18n } from "@/lib/i18n";
import { ar } from "@/lib/i18n/ar";
import { en } from "@/lib/i18n/en";

describe("i18n", () => {
  it("Arabic defines every English key and no extras", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    for (const [k, v] of Object.entries(ar)) expect(v.trim(), k).not.toBe("");
  });

  it("keeps the same placeholders in both languages", () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[])
      expect(vars(ar[key]), key).toEqual(vars(en[key]));
  });

  it("interpolates variables", () => {
    expect(interpolate("Row {n} of {total}", { n: 2, total: 9 })).toBe("Row 2 of 9");
    expect(translate("ar", "csv.row", { n: 4 })).toBe("الصف 4");
  });

  it("switching to Arabic sets lang and dir=rtl on <html>", async () => {
    function Probe() {
      const { t, setLocale, locale } = useI18n();
      return (
        <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")}>{t("nav.inbox")}</button>
      );
    }
    render(
      <I18nProvider defaultLocale="en">
        <Probe />
      </I18nProvider>,
    );
    expect(document.documentElement.dir).toBe("ltr");
    await userEvent.click(screen.getByRole("button", { name: "Idea inbox" }));
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
    expect(screen.getByRole("button")).toHaveTextContent("صندوق الأفكار");
  });
});
