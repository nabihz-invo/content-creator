import { createPreviewServer, storageSource } from "./server.ts";

const required = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`missing ${k}`);
  return v;
};
const port = Number(process.env.PORT ?? 54400);
const server = createPreviewServer({
  secret: required("PREVIEW_SIGNING_SECRET"),
  source: storageSource(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY")),
  frameAncestors: (process.env.CRM_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});
server.listen(port, () => console.log(`preview server on :${port}`));
