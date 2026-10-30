-- P2-T08: what the n8n notify workflow needs to message a project's owner.
create or replace function public.notification_target(p_project_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'project_id', p.id,
    'title', p.title,
    'status', p.status,
    'telegram_user_id', pr.telegram_user_id,
    'locale', coalesce(pr.locale, 'en')
  )
  from public.content_projects p
  left join public.profiles pr on pr.id = p.owner_id
  where p.id = p_project_id;
$$;
revoke all on function public.notification_target(uuid) from public, anon, authenticated;
grant execute on function public.notification_target(uuid) to service_role;
