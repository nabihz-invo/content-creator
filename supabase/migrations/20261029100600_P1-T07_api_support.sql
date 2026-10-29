-- P1-T07 / P1-T10: API support tables — rate limits and Telegram account linking.

-- Fixed-window rate limiter used by Edge Functions.
create table public.api_rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);
alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from authenticated;

-- Returns true when the call is allowed (and counts it).
create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer default 60)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  win timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  insert into public.api_rate_limits (key, window_start, count) values (p_key, win, 1)
  on conflict (key, window_start) do update set count = public.api_rate_limits.count + 1
  returning count into n;
  -- Opportunistic cleanup of old windows for this key.
  delete from public.api_rate_limits where key = p_key and window_start < win - interval '1 hour';
  return n <= p_limit;
end;
$$;

-- One-time codes that connect a Telegram account to a CRM user:
-- the user creates a code in the CRM and sends `/link <code>` to the bot.
create table public.telegram_link_codes (
  code text primary key check (code ~ '^[A-Z0-9]{8}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index telegram_link_codes_user_idx on public.telegram_link_codes (user_id);
alter table public.telegram_link_codes enable row level security;
revoke all on public.telegram_link_codes from authenticated;

create or replace function public.create_telegram_link_code(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
begin
  delete from public.telegram_link_codes where user_id = p_user_id and used_at is null;
  loop
    select string_agg(substr(alphabet, 1 + (get_byte(b, i) % length(alphabet)), 1), '')
      into c
    from (select extensions.gen_random_bytes(8) as b) r, generate_series(0, 7) as i;
    begin
      insert into public.telegram_link_codes (code, user_id, expires_at)
      values (c, p_user_id, now() + interval '15 minutes');
      return c;
    exception when unique_violation then
      -- extremely unlikely; try another code
    end;
  end loop;
end;
$$;

-- Consumes a code and links the Telegram user id. Returns the CRM user id,
-- or null when the code is unknown, used, or expired.
create or replace function public.consume_telegram_link_code(p_code text, p_telegram_user_id bigint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  update public.telegram_link_codes
  set used_at = now()
  where code = upper(p_code) and used_at is null and expires_at > now()
  returning user_id into uid;
  if uid is null then
    return null;
  end if;
  -- A Telegram account belongs to one CRM user at a time.
  update public.profiles set telegram_user_id = null where telegram_user_id = p_telegram_user_id and id <> uid;
  update public.profiles set telegram_user_id = p_telegram_user_id where id = uid;
  perform public.log_event(null, 'telegram.linked', jsonb_build_object('telegram_user_id', p_telegram_user_id), uid);
  return uid;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.hit_rate_limit(text, integer, integer)',
    'public.create_telegram_link_code(uuid)',
    'public.consume_telegram_link_code(text, bigint)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
