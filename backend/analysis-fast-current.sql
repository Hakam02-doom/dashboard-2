-- Keep the global budget in one small row instead of rewriting legacy answers.
-- The existing counts are carried forward; this does not reset the allowance.
set lock_timeout='5s';
create table public.ai_collection_budget (
 id boolean primary key default true check(id),
 search integer not null default 0 check(search>=0),
 analysis integer not null default 0 check(analysis>=0),
 direct integer not null default 0 check(direct>=0)
);
alter table public.ai_collection_budget enable row level security;
revoke all on public.ai_collection_budget from public,anon,authenticated;
grant select,update on public.ai_collection_budget to service_role;
lock table public.ai_collector_store in share row exclusive mode;
insert into public.ai_collection_budget(id,search,analysis,direct)
select true,coalesce((payload->>'attempts')::int,0),coalesce((payload->>'analysisAttempts')::int,0),coalesce((payload->>'directAttempts')::int,0)
from public.ai_collector_store where id=true;
create or replace function public.ai_global_usage() returns jsonb
language sql security invoker set search_path='' as $$
 select jsonb_build_object('search',search,'analysis',analysis,'direct',direct) from public.ai_collection_budget where id=true;
$$;
create or replace function public.ai_global_reserve(counter text,maximum int) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if maximum<1 then raise exception 'invalid budget reservation';end if;
 if counter='analysis' then update public.ai_collection_budget set analysis=analysis+1 where id=true and analysis<least(maximum,500);
 elsif counter='search' then update public.ai_collection_budget set search=search+1 where id=true and search<maximum;
 elsif counter='direct' then update public.ai_collection_budget set direct=direct+1 where id=true and direct<maximum;
 else raise exception 'invalid budget reservation';end if;
 return found;
end;$$;

-- A browser has one current analysis. Refreshes reconnect to that run; switching
-- websites starts fresh. Operational rows remain for quotas, not report history.
create or replace function public.ai_analysis_enqueue(account_id uuid,website_url text,website_domain text,visitor text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare job public.ai_analysis_jobs;
begin
 perform pg_advisory_xact_lock(823715001);
 select * into job from public.ai_analysis_jobs where owner_id=account_id order by created_at desc limit 1;
 if found and job.domain=website_domain and (job.status in ('queued','running') or job.status='complete' and job.target=100) then return to_jsonb(job);end if;
 if (select count(*) from public.ai_analysis_jobs where owner_id=account_id and created_at>now()-interval '24 hours')>=3 then raise exception 'DAILY_VISITOR_LIMIT';end if;
 if (select count(*) from public.ai_analysis_jobs where visitor_hash=visitor and created_at>now()-interval '24 hours')>=10 then raise exception 'DAILY_NETWORK_LIMIT';end if;
 if (select count(*) from public.ai_analysis_jobs where status in ('queued','running'))>=100 then raise exception 'QUEUE_FULL';end if;
 update public.ai_analysis_jobs set status='failed',stage='Replaced by a new website',error='Replaced by a new website',lease=null,lease_until=null,updated_at=now()
 where owner_id=account_id and status in ('queued','running');
 insert into public.ai_analysis_jobs(owner_id,url,domain,visitor_hash) values(account_id,website_url,website_domain,visitor) returning * into job;
 return to_jsonb(job);
end;$$;

-- Called only after acquiring the workspace lease; an old in-flight writer
-- cannot race the reset. Keep quota metadata but discard previous report bodies.
create function public.ai_analysis_discard_previous(account_id uuid,current_job uuid,lock_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.ai_collector_workspaces w where w.owner_id=account_id and w.lease=lock_id and w.lease_until>now()) then raise exception 'lease expired';end if;
 if not exists(select 1 from public.ai_analysis_jobs j where j.id=current_job and j.owner_id=account_id and j.status='running') then raise exception 'analysis superseded';end if;
 update public.ai_analysis_requests r set response=null from public.ai_analysis_jobs j where r.job_id=j.id and j.owner_id=account_id and j.id<>current_job;
 update public.ai_analysis_jobs set profile=null where owner_id=account_id and id<>current_job;
 delete from public.ai_businesses where owner_id=account_id;
 update public.ai_collector_store set payload=jsonb_build_object('attempts',coalesce((payload->>'attempts')::int,0),'analysisAttempts',coalesce((payload->>'analysisAttempts')::int,0),'directAttempts',coalesce((payload->>'directAttempts')::int,0),'answers','[]'::jsonb) where owner_id=account_id;
 update public.ai_collector_workspaces set payload=jsonb_build_object('attempts',0,'answers','[]'::jsonb,'activeRunId',current_job::text),updated_at=now() where owner_id=account_id;
end;$$;
revoke all on function public.ai_analysis_discard_previous(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.ai_analysis_discard_previous(uuid,uuid,uuid) to service_role;

alter table public.ai_analysis_requests add column duration_ms integer;
alter table public.ai_analysis_requests add column provider_kind text;

create or replace function public.ai_analysis_finish(job_id uuid,lock_id uuid,new_status text,new_stage text,new_progress int,new_profile jsonb,failure text,delay_seconds int default 0) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if new_status not in ('queued','complete','failed') or new_progress not between 0 and 100 then raise exception 'invalid job transition';end if;
 update public.ai_analysis_jobs set status=new_status,stage=new_stage,progress=new_progress,profile=coalesce(new_profile,profile),error=failure,
 lease=null,lease_until=null,attempts=case when new_stage='Reconnecting to analysis storage' then attempts else 0 end,available_at=now()+make_interval(secs=>greatest(0,least(delay_seconds,60))),updated_at=now()
 where id=job_id and lease=lock_id and status='running' and lease_until>now();
 return found;
end;$$;
