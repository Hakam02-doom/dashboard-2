create table public.ai_collector_store (
 id boolean primary key default true check(id),
 owner_id uuid references auth.users(id),
 payload jsonb not null default '{"attempts":0,"answers":[]}'::jsonb,
 lease uuid, lease_until timestamptz, updated_at timestamptz not null default now()
);
alter table public.ai_collector_store enable row level security;
revoke all on public.ai_collector_store from public, anon, authenticated;
grant select,insert,update on public.ai_collector_store to service_role;
insert into public.ai_collector_store(id) values(true);
create function public.ai_collector_read() returns jsonb language sql security invoker set search_path='' as $$
 select payload from public.ai_collector_store where id=true;
$$;
create function public.ai_collector_lock(lease uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare acquired uuid;
begin
 update public.ai_collector_store s set lease=ai_collector_lock.lease,lease_until=now()+interval '10 minutes'
 where id=true and (s.lease is null or s.lease_until<now()) returning s.lease into acquired;
 return acquired;
end;$$;
create function public.ai_collector_write(payload jsonb,lease uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if jsonb_typeof(payload->'answers')<>'array' or (payload->>'attempts')::int<0 then raise exception 'invalid state';end if;
 update public.ai_collector_store s set payload=ai_collector_write.payload,updated_at=now(),lease_until=now()+interval '10 minutes'
 where id=true and s.lease=ai_collector_write.lease and s.lease_until>now();
 if not found then raise exception 'lease expired';end if;
end;$$;
create function public.ai_collector_unlock(lease uuid) returns void language sql security invoker set search_path='' as $$
 update public.ai_collector_store s set lease=null,lease_until=null where id=true and s.lease=ai_collector_unlock.lease;
$$;
revoke all on function public.ai_collector_read(),public.ai_collector_lock(uuid),public.ai_collector_write(jsonb,uuid),public.ai_collector_unlock(uuid) from public,anon,authenticated;
grant execute on function public.ai_collector_read(),public.ai_collector_lock(uuid),public.ai_collector_write(jsonb,uuid),public.ai_collector_unlock(uuid) to service_role;
