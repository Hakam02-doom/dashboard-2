create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create schema if not exists ai_private;
revoke all on schema ai_private from public,anon,authenticated;
create function public.ai_configure_worker(worker_secret text) returns void
language plpgsql security definer set search_path='' as $$
declare existing uuid;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'server only';end if;
 if length(worker_secret)<32 then raise exception 'invalid secret';end if;
 select id into existing from vault.secrets where name='dashboard2_worker_secret';
 if existing is null then perform vault.create_secret(worker_secret,'dashboard2_worker_secret','Dashboard 2 scheduled collection only');
 else perform vault.update_secret(existing,worker_secret);end if;
end;$$;
revoke all on function public.ai_configure_worker(text) from public,anon,authenticated;
grant execute on function public.ai_configure_worker(text) to service_role;
create function ai_private.dispatch_worker() returns void
language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if not exists(select 1 from public.ai_collector_store s,jsonb_each(coalesce(s.payload->'schedules','{}'::jsonb)) schedules where (schedules.value->>'enabled')::boolean=true) then return;end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='dashboard2_worker_secret';
 if token is null then return;end if;
 perform net.http_post(url:='https://dashboard-2-sandy.vercel.app/api/ai/cron',
 headers:=jsonb_build_object('Authorization','Bearer '||token,'Content-Type','application/json'),
 body:='{}'::jsonb,timeout_milliseconds:=300000);
end;$$;
revoke all on function ai_private.dispatch_worker() from public,anon,authenticated;
select cron.schedule('dashboard2-ai-collection','*/5 * * * *','select ai_private.dispatch_worker()');
