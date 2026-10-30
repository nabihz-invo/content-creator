// The worker uses the Playwright build installed with the Chromium it runs
// (resolved at runtime with require), so only the surface we call is typed here.
declare module "playwright" {
  interface Route {
    request(): { url(): string };
    continue(): Promise<void>;
    abort(): Promise<void>;
  }
  interface ConsoleMessage {
    type(): string;
    text(): string;
  }
  interface Page {
    on(event: "pageerror", fn: (e: Error) => void): void;
    on(event: "console", fn: (m: ConsoleMessage) => void): void;
    goto(
      url: string,
      opts?: { waitUntil?: "load" | "networkidle"; timeout?: number },
    ): Promise<unknown>;
    waitForFunction(
      fn: () => boolean,
      arg?: unknown,
      opts?: { timeout?: number },
    ): Promise<unknown>;
    evaluate<T>(fn: () => T): Promise<T>;
    screenshot(opts?: { type?: "png" | "jpeg"; fullPage?: boolean }): Promise<Buffer>;
    close(): Promise<void>;
  }
  interface BrowserContext {
    route(pattern: string, handler: (route: Route) => unknown): Promise<void>;
    newPage(): Promise<Page>;
  }
  interface Browser {
    newContext(opts?: Record<string, unknown>): Promise<BrowserContext>;
    close(): Promise<void>;
  }
  export const chromium: { launch(opts?: { args?: string[] }): Promise<Browser> };
}
