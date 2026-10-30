import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { contentType } from "./static-server.ts";

export interface Storage {
  upload(bucket: string, path: string, body: Buffer, contentType: string): Promise<void>;
}

export function supabaseStorage(url: string, serviceRoleKey: string): Storage {
  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  return {
    async upload(bucket, path, body, type) {
      // upsert: a retried job overwrites its own partial upload.
      const { error } = await client.storage
        .from(bucket)
        .upload(path, body, { contentType: type, upsert: true, cacheControl: "300" });
      if (error) throw new Error(`upload ${bucket}/${path}: ${error.message}`);
    },
  };
}

export async function uploadDir(
  storage: Storage,
  bucket: string,
  prefix: string,
  dir: string,
  files: string[],
  concurrency = 6,
) {
  const queue = [...files];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let f = queue.shift(); f; f = queue.shift())
        await storage.upload(bucket, `${prefix}${f}`, readFileSync(join(dir, f)), contentType(f));
    }),
  );
}
