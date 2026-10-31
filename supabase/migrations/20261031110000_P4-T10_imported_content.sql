-- P4-T10: content imported from an existing content plan (spreadsheet).
-- Imported rows are ordinary projects (status `new`, tagged, the full plan row
-- kept in source_metadata.content_plan) so the AI can later see what already
-- exists and avoid duplicates. Content that was produced and posted outside
-- the pipeline can be closed with its public link: `new → published`, allowed
-- only through mark_imported_published() and only for imported rows.

-- BEGIN ADDED TRANSITIONS (mirrored in packages/shared/src/status.ts)
insert into public.project_status_transitions (from_status, to_status, trigger_description) values
  ('new', 'published', 'imported content already published outside the pipeline (link recorded)');
-- END ADDED TRANSITIONS

create or replace function public.mark_imported_published(
  p_actor_id uuid,
  p_project_id uuid,
  p_published_url text,
  p_published_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  published jsonb;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if coalesce(proj.source_metadata ->> 'origin', '') <> 'content_plan_import' then
    raise exception 'approval_required: only content imported from a content plan can be marked published without the pipeline'
      using errcode = 'P0001', hint = 'approval_required';
  end if;
  if coalesce(p_published_url, '') !~ '^https://[^\s]+$' then
    raise exception 'validation_failed: the post URL must be an https link' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if proj.status = 'published' then
    return jsonb_build_object('project_id', proj.id, 'status', proj.status,
      'published_url', proj.source_metadata -> 'published' ->> 'url', 'replayed', true);
  end if;
  if proj.status <> 'new' then
    raise exception 'invalid_transition: this project is in the pipeline (%); publish it through its publishing package', proj.status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;

  published := jsonb_build_object('url', p_published_url, 'at', coalesce(p_published_at, now()), 'confirmed_by', p_actor_id);
  update public.content_projects
  set source_metadata = source_metadata || jsonb_build_object('published', published)
  where id = proj.id;
  perform public.transition_project(proj.id, 'published', p_actor_id,
    jsonb_build_object('external', true, 'url', p_published_url), 'new');
  perform public.log_event(proj.id, 'publishing.published_externally', published, p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'status', 'published', 'published_url', p_published_url, 'replayed', false);
end;
$$;

revoke all on function public.mark_imported_published(uuid, uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.mark_imported_published(uuid, uuid, text, timestamptz) to service_role;
