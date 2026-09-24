set lock_timeout='5s';
alter table public.ai_analysis_jobs drop constraint ai_analysis_jobs_target_check;
alter table public.ai_analysis_jobs add constraint ai_analysis_jobs_target_check check (target in (3,40,100));
alter table public.ai_analysis_jobs alter column target set default 40;
create or replace function public.ai_analysis_enqueue(account_id uuid,website_url text,website_domain text,visitor text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare job public.ai_analysis_jobs;
begin
 perform pg_advisory_xact_lock(823715001);
 select * into job from public.ai_analysis_jobs where owner_id=account_id order by created_at desc limit 1;
 if found and job.domain=website_domain and (job.status in ('queued','running') or job.status='complete' and job.target=40) then return to_jsonb(job);end if;
 if (select analysis from public.ai_collection_budget where id=true)+84>600 then raise exception 'ANALYSIS_BUDGET_LOW';end if;
 if (select count(*) from public.ai_analysis_jobs where owner_id=account_id and created_at>now()-interval '24 hours' and not (status='failed' and progress=0 and not exists(select 1 from public.ai_analysis_requests r where r.job_id=ai_analysis_jobs.id)))>=3 then raise exception 'DAILY_VISITOR_LIMIT';end if;
 if (select count(*) from public.ai_analysis_jobs where visitor_hash=visitor and created_at>now()-interval '24 hours')>=10 then raise exception 'DAILY_NETWORK_LIMIT';end if;
 if (select count(*) from public.ai_analysis_jobs where status in ('queued','running'))>=100 then raise exception 'QUEUE_FULL';end if;
 update public.ai_analysis_jobs set status='failed',stage='Replaced by a new website',error='Replaced by a new website',lease=null,lease_until=null,updated_at=now()
 where owner_id=account_id and status in ('queued','running');
 insert into public.ai_analysis_jobs(owner_id,url,domain,visitor_hash,target) values(account_id,website_url,website_domain,visitor,40) returning * into job;
 return to_jsonb(job);
end;$$;


create or replace function public.ai_global_reserve(counter text,maximum int) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if maximum<1 then raise exception 'invalid budget reservation';end if;
 if counter='analysis' then update public.ai_collection_budget set analysis=analysis+1 where id=true and analysis<least(maximum,600);
 elsif counter='search' then update public.ai_collection_budget set search=search+1 where id=true and search<maximum;
 elsif counter='direct' then update public.ai_collection_budget set direct=direct+1 where id=true and direct<maximum;
 else raise exception 'invalid budget reservation';end if;
 return found;
end;$$;

