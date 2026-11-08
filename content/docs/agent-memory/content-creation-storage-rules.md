---
name: content-creation-storage-rules
description: "User's Supabase storage rules for content-creation — upload the minimum, deletes remove storage, free storage once published and keep only the live link"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 69e4889b-0b75-4877-80e0-31da3d6d1746
  modified: 2026-11-01T09:23:03.715Z
---

The user's storage rules for the content-creation Supabase project (given 2026-11-01):

1. Minimise what is uploaded to Supabase storage so the project does not run out of space: only files the pipeline or the CRM actually needs; source files (HTML, JSON, logs, voice takes) stay local.
2. Deleting any record must also delete its storage object. Never leave orphaned files in a bucket.
3. Once an item is published on social media, its storage can be freed: remove the Supabase file and keep the record pointing at the live post URL (reel / post link) instead.

**Why:** Supabase storage quota is limited, and published media already lives on the social platform.
**How to apply:** every new upload path, table or delete flow in content-creation must follow these rules: a storage-cleanup path for deletes, and a "release" path for published items. Applies to imported finished posts (P5-T15) and to pipeline renders too. See [[content-v2-production-rules]].
