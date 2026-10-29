/**
 * Sanitizes untrusted text (Telegram, CSV, web pages). Keeps newlines and
 * tabs, removes other control characters and bidi overrides that could hide
 * content, normalizes Unicode, and trims.
 */
export function cleanText(input: string, maxLength = 20000): string {
  return (
    input
      .normalize("NFC")
      .replace(/\r\n?/g, "\n")
      // C0/C1 controls except \t and \n; bidi embedding/override/isolate controls
      // deno-lint-ignore no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‪-‮⁦-⁩]/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, maxLength)
  );
}

/**
 * Neutralizes spreadsheet formula injection in CSV cells: a cell that would be
 * interpreted as a formula when exported again loses its leading trigger.
 * A leading "-" is kept when followed by a space or digit (lists, numbers).
 */
export function stripFormula(cell: string): string {
  let s = cell.replace(/^[\t\r]+/, "");
  while (/^[=+@]/.test(s) || /^-(?![\s\d])/.test(s)) s = s.slice(1);
  return s;
}

export function extractFirstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"'`]+/i);
  if (!m) return null;
  return m[0].replace(/[).,;!?]+$/, "");
}
