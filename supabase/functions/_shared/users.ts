import { createClient } from "@supabase/supabase-js";

/** Account creation for client logins (P5-T26), behind a port so tests can fake it. */
export interface UserAdminPort {
  /**
   * Creates a confirmed account for a client and returns its id. app_metadata.stacko_client tells the
   * signup trigger not to give them a personal workspace. They sign in with the usual email link.
   */
  createClient(email: string): Promise<string>;
}

export function supabaseUsers(url: string, serviceRoleKey: string): UserAdminPort {
  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  return {
    async createClient(email) {
      const { data, error } = await client.auth.admin.createUser({
        email,
        email_confirm: true,
        app_metadata: { stacko_client: true },
      });
      if (error || !data.user) throw error ?? new Error("could not create the account");
      return data.user.id;
    },
  };
}
