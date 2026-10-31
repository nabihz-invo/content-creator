import { createClient } from "@supabase/supabase-js";

/** Minimal storage port so handlers can be tested without the Storage API. */
export interface StoragePort {
  upload(bucket: string, path: string, data: Uint8Array, contentType: string): Promise<void>;
  /** Reads a stored file (publishing bundles). */
  download(bucket: string, path: string): Promise<Uint8Array>;
}

export function supabaseStorage(url: string, serviceRoleKey: string): StoragePort {
  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  return {
    async upload(bucket, path, data, contentType) {
      const { error } = await client.storage.from(bucket).upload(path, data, {
        contentType,
        upsert: false,
      });
      if (error) throw error;
    },
    async download(bucket, path) {
      const { data, error } = await client.storage.from(bucket).download(path);
      if (error || !data) throw error ?? new Error(`download ${bucket}/${path} failed`);
      return new Uint8Array(await data.arrayBuffer());
    },
  };
}
