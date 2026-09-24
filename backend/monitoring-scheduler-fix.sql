-- Keep scheduler decisions in the database instead of downloading every
-- workspace's potentially large answer history on each tick.
create or replace function public.ai_scheduled_owners() returns setof uuid
language sql security invoker set search_path='' as $$
  select distinct w.owner_id
  from public.ai_collector_workspaces w
  cross join lateral jsonb_each(coalesce(w.payload->'schedules','{}'::jsonb)) s(key,value)
  where s.value->>'enabled'='true';
$$;
revoke all on function public.ai_scheduled_owners() from public,anon,authenticated;
grant execute on function public.ai_scheduled_owners() to service_role;

create or replace function ai_private.dispatch_worker() returns void
language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if not exists(select 1 from public.ai_scheduled_owners()) then return;end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='dashboard2_worker_secret';
 if token is null then return;end if;
 perform net.http_post(url:='https://dashboard-2-sandy.vercel.app/api/ai/cron',
 headers:=jsonb_build_object('Authorization','Bearer '||token,'Content-Type','application/json'),
 body:='{}'::jsonb,timeout_milliseconds:=300000);
end;$$;
revoke all on function ai_private.dispatch_worker() from public,anon,authenticated;
