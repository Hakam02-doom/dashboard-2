-- Each authenticated account has an isolated collector workspace. The original
-- owner's existing history is copied once; the legacy row remains as the shared
-- request-budget ledger and a recoverable backup.
create table public.ai_collector_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"attempts":0,"answers":[]}'::jsonb,
  lease uuid,
  lease_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.ai_collector_workspaces enable row level security;
revoke all on public.ai_collector_workspaces from public, anon, authenticated;
grant select, insert, update on public.ai_collector_workspaces to service_role;

insert into public.ai_collector_workspaces(owner_id, payload)
select owner_id, payload from public.ai_collector_store where id=true and owner_id is not null
on conflict (owner_id) do nothing;

create function public.ai_workspace_init(account_id uuid) returns void
language sql security invoker set search_path='' as $$
  insert into public.ai_collector_workspaces(owner_id) values(account_id)
  on conflict (owner_id) do nothing;
$$;
create function public.ai_workspace_claim(account_id uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
  insert into public.ai_collector_workspaces(owner_id) values(account_id)
  on conflict (owner_id) do nothing;
  return exists (
    select 1 from public.ai_collector_store
    where id=true and owner_id=account_id
  );
end;$$;
create function public.ai_workspace_read(account_id uuid) returns jsonb
language sql security invoker set search_path='' as $$
  select payload from public.ai_collector_workspaces where owner_id=account_id;
$$;
create function public.ai_workspace_lock(account_id uuid, lock_id uuid) returns uuid
language plpgsql security invoker set search_path='' as $$
declare acquired uuid;
begin
  update public.ai_collector_workspaces s set lease=lock_id,lease_until=now()+interval '10 minutes'
  where owner_id=account_id and (s.lease is null or s.lease_until<now()) returning s.lease into acquired;
  return acquired;
end;$$;
create function public.ai_workspace_write(account_id uuid, state jsonb, lock_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
  if jsonb_typeof(state->'answers')<>'array' or (state->>'attempts')::int<0 then raise exception 'invalid state';end if;
  update public.ai_collector_workspaces s set payload=state,updated_at=now(),lease_until=now()+interval '10 minutes'
  where owner_id=account_id and s.lease=lock_id and s.lease_until>now();
  if not found then raise exception 'lease expired';end if;
end;$$;
create function public.ai_workspace_unlock(account_id uuid, lock_id uuid) returns void
language sql security invoker set search_path='' as $$
  update public.ai_collector_workspaces s set lease=null,lease_until=null
  where owner_id=account_id and s.lease=lock_id;
$$;

-- Atomic reservations are shared by all accounts, so creating an account cannot
-- reset the SearchAPI trial, OpenAI budget, or direct collector allowance.
create function public.ai_global_usage() returns jsonb
language sql security invoker set search_path='' as $$
  select jsonb_build_object(
    'search',coalesce((payload->>'attempts')::int,0),
    'analysis',coalesce((payload->>'analysisAttempts')::int,0),
    'direct',coalesce((payload->>'directAttempts')::int,0)
  ) from public.ai_collector_store where id=true;
$$;
create function public.ai_global_reserve(counter text, maximum int) returns boolean
language plpgsql security invoker set search_path='' as $$
declare field_name text;
begin
  field_name:=case counter when 'search' then 'attempts' when 'analysis' then 'analysisAttempts' when 'direct' then 'directAttempts' else null end;
  if field_name is null or maximum<1 then raise exception 'invalid budget reservation';end if;
  update public.ai_collector_store s
  set payload=jsonb_set(s.payload,array[field_name],to_jsonb(coalesce((s.payload->>field_name)::int,0)+1),true)
  where id=true and coalesce((s.payload->>field_name)::int,0)<maximum;
  return found;
end;$$;

revoke all on function public.ai_workspace_init(uuid),public.ai_workspace_read(uuid),public.ai_workspace_lock(uuid,uuid),public.ai_workspace_write(uuid,jsonb,uuid),public.ai_workspace_unlock(uuid,uuid),public.ai_global_usage(),public.ai_global_reserve(text,int) from public,anon,authenticated;
grant execute on function public.ai_workspace_init(uuid),public.ai_workspace_read(uuid),public.ai_workspace_lock(uuid,uuid),public.ai_workspace_write(uuid,jsonb,uuid),public.ai_workspace_unlock(uuid,uuid),public.ai_global_usage(),public.ai_global_reserve(text,int) to service_role;
revoke all on function public.ai_workspace_claim(uuid) from public,anon,authenticated;
grant execute on function public.ai_workspace_claim(uuid) to service_role;

-- Keep large answer histories in Postgres when deciding whether a worker is
-- needed. Only owner IDs cross the API boundary.
create function public.ai_scheduled_owners() returns setof uuid
language sql security invoker set search_path='' as $$
  select distinct w.owner_id
  from public.ai_collector_workspaces w
  cross join lateral jsonb_each(coalesce(w.payload->'schedules','{}'::jsonb)) s(key,value)
  where s.value->>'enabled'='true';
$$;
revoke all on function public.ai_scheduled_owners() from public,anon,authenticated;
grant execute on function public.ai_scheduled_owners() to service_role;
