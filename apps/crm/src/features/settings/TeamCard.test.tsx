import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/lib/i18n";
import { TeamCard } from "./TeamCard";

const { rpc, insert, del, addClient } = vi.hoisted(() => ({
  rpc: vi.fn(),
  insert: vi.fn(),
  del: vi.fn(),
  addClient: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ api: { addClient } }));
// jsdom has no ResizeObserver; Radix's checkbox uses it when one appears after the first render.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc,
    from: () => ({
      insert,
      delete: () => ({ eq: () => ({ eq: del }) }),
    }),
  },
}));
vi.mock("@/lib/workspace", () => ({ useWorkspace: () => ({ workspaceId: "ws", userId: "me" }) }));
vi.mock("@/lib/queries", () => ({
  useBrands: () => ({
    data: [
      { id: "stacko", name: "Stacko" },
      { id: "aiphin", name: "Aiphin" },
    ],
  }),
}));

function show() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <I18nProvider>
        <TeamCard />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe("TeamCard", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    del.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({
      error: null,
      data: [
        {
          user_id: "me",
          email: "owner@example.com",
          display_name: "Owner",
          role: "admin",
          brand_ids: [],
        },
        {
          user_id: "u2",
          email: "sam@example.com",
          display_name: "Sam",
          role: "editor",
          brand_ids: ["stacko"],
        },
      ],
    });
  });

  it("shows admins as all brands and an editor's linked brands", async () => {
    show();
    await screen.findByText("Sam");
    expect(screen.getByText("All brands")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Stacko" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Aiphin" })).not.toBeChecked();
  });

  it("links and unlinks a brand when ticked", async () => {
    const user = userEvent.setup();
    show();
    await screen.findByText("Sam");
    await user.click(screen.getByRole("checkbox", { name: "Aiphin" }));
    await waitFor(() =>
      expect(insert).toHaveBeenCalledWith({ brand_id: "aiphin", user_id: "u2", created_by: "me" }),
    );
    const stacko = document.getElementById("team-u2-stacko")!;
    await waitFor(() => expect(stacko).toBeEnabled());
    await user.click(stacko);
    await waitFor(() => expect(del).toHaveBeenCalledWith("user_id", "u2"));
  });

  it("adds a client with their brands through the API (the account is created there)", async () => {
    const user = userEvent.setup();
    addClient.mockResolvedValue({ user_id: "c1", created: true });
    show();
    await screen.findByText("Sam");
    await user.type(screen.getByLabelText("Email"), "client@brand.com");
    await user.selectOptions(document.getElementById("team-role")!, "client");
    const add = screen.getByRole("button", { name: "Add member" });
    expect(add).toBeDisabled(); // a client needs at least one brand
    await user.click(document.getElementById("team-new-aiphin")!);
    await user.click(add);
    await waitFor(() =>
      expect(addClient).toHaveBeenCalledWith("ws", "client@brand.com", ["aiphin"]),
    );
    expect(rpc).not.toHaveBeenCalledWith("add_workspace_member", expect.anything());
  });
});
