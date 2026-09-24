-- Existing jobs keep their original target; new jobs measure 100 questions.
alter table public.ai_analysis_jobs add column target integer not null default 3 check(target in (3,100));
alter table public.ai_analysis_jobs alter column target set default 100;
create or replace function public.ai_analysis_enqueue(account_id uuid,website_url text,website_domain text,visitor text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare job public.ai_analysis_jobs;
begin
 perform pg_advisory_xact_lock(823715001);
 select * into job from public.ai_analysis_jobs where owner_id=account_id and domain=website_domain and
 (status in ('queued','running') or status='complete' and target=100 and created_at>now()-interval '24 hours') order by created_at desc limit 1;
 if found then return to_jsonb(job);end if;
 if (select count(*) from public.ai_analysis_jobs where owner_id=account_id and created_at>now()-interval '24 hours')>=3 then raise exception 'DAILY_VISITOR_LIMIT';end if;
 if (select count(*) from public.ai_analysis_jobs where visitor_hash=visitor and created_at>now()-interval '24 hours')>=10 then raise exception 'DAILY_NETWORK_LIMIT';end if;
 if (select count(*) from public.ai_analysis_jobs where status in ('queued','running'))>=100 then raise exception 'QUEUE_FULL';end if;
 insert into public.ai_analysis_jobs(owner_id,url,domain,visitor_hash) values(account_id,website_url,website_domain,visitor) returning * into job;
 return to_jsonb(job);
end;$$;
