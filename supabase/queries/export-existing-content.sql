-- Everything already planned or produced, as ONE JSON array, so a content agent can check new
-- ideas against it before writing import SQL (docs/prompts/research-to-content-sql.md).
--
-- Supabase SQL editor: run, copy the single cell, save it as research/existing-content.json.
-- psql:  psql "$SUPABASE_DB_URL" -At -f supabase/queries/export-existing-content.sql > research/existing-content.json
--
-- One object per project: plan ID (for imported rows), title, status, format, dates, the hook /
-- objective / pillar / creative codes from the plan, tags, and for ideas that came in through
-- the CRM the first 600 characters of the idea. Cancelled projects are left out.
select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.publish_date nulls last, x.plan_id), '[]'::jsonb)
from (
  select
    p.source_metadata ->> 'plan_id' as plan_id,
    p.title,
    p.status::text as status,
    p.source_metadata ->> 'plan_status' as plan_status,
    coalesce(p.source_metadata ->> 'format', p.content_type::text) as format,
    p.source_metadata ->> 'publish_date' as publish_date,
    p.source_metadata ->> 'target_month' as target_month,
    p.source_metadata ->> 'sheet' as sheet,
    p.source_metadata ->> 'source_file' as source_file,
    cp ->> 'Pillar' as pillar,
    cp ->> 'Funnel' as funnel,
    coalesce(cp ->> 'Stage label (on screen)', cp ->> 'Stage label') as stage_label,
    coalesce(cp ->> 'Hook EN (on screen, first 1.5 s)', cp ->> 'Hook') as hook,
    cp ->> 'Objective' as objective,
    cp ->> 'Recipe (RC)' as rc,
    cp ->> 'Hook type (HK)' as hk,
    cp ->> 'Opener (OP)' as op,
    cp ->> 'End card (EC)' as ec,
    cp ->> 'Slide / frame layouts (CL)' as cl,
    cp ->> 'Overlaps with' as overlaps_with,
    p.source_metadata -> 'published' ->> 'url' as published_url,
    (select array_agg(t.name order by t.name) from public.project_tags pt join public.tags t on t.id = pt.tag_id
      where pt.project_id = p.id) as tags,
    case when p.source_metadata ->> 'origin' = 'content_plan_import' then null
         else left(p.original_idea, 600) end as idea_excerpt
  from public.content_projects p
  left join lateral (select p.source_metadata -> 'content_plan' as cp) c on true
  where p.status <> 'cancelled'
) x;
