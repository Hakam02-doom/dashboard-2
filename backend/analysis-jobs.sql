-- Durable public website analysis. All queue operations remain server-only.
create table public.ai_analysis_jobs (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 domain text not null, url text not null, visitor_hash text not null,
 status text not null default 'queued' check(status in ('queued','running','complete','failed')),
 stage text not null default 'Reading your website', progress integer not null default 0,
 profile jsonb, error text, lease uuid, lease_until timestamptz,
 attempts integer not null default 0, available_at timestamptz not null default now(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index ai_analysis_one_active on public.ai_analysis_jobs(owner_id,domain) where status in ('queued','running');
create index ai_analysis_queue on public.ai_analysis_jobs(status,available_at,created_at);
create index ai_analysis_owner on public.ai_analysis_jobs(owner_id,created_at);
create index ai_analysis_visitor on public.ai_analysis_jobs(visitor_hash,created_at);
alter table public.ai_analysis_jobs enable row level security;
revoke all on public.ai_analysis_jobs from public,anon,authenticated;
grant select,insert,update,delete on public.ai_analysis_jobs to service_role;
create table public.ai_analysis_requests (
 job_id uuid not null references public.ai_analysis_jobs(id) on delete cascade, fingerprint text not null,
 status text not null check(status in ('started','complete')), response jsonb, http_status integer,
 created_at timestamptz not null default now(), primary key(job_id,fingerprint)
);
alter table public.ai_analysis_requests enable row level security;
revoke all on public.ai_analysis_requests from public,anon,authenticated;
grant select,insert,update,delete on public.ai_analysis_requests to service_role;

create function public.ai_analysis_enqueue(account_id uuid,website_url text,website_domain text,visitor text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare job public.ai_analysis_jobs;
begin
 perform pg_advisory_xact_lock(823715001);
 select * into job from public.ai_analysis_jobs where owner_id=account_id and domain=website_domain and
 (status in ('queued','running') or status='complete' and created_at>now()-interval '24 hours') order by created_at desc limit 1;
 if found then return to_jsonb(job);end if;
 if (select count(*) from public.ai_analysis_jobs where owner_id=account_id and created_at>now()-interval '24 hours')>=3 then raise exception 'DAILY_VISITOR_LIMIT';end if;
 if (select count(*) from public.ai_analysis_jobs where visitor_hash=visitor and created_at>now()-interval '24 hours')>=10 then raise exception 'DAILY_NETWORK_LIMIT';end if;
 if (select count(*) from public.ai_analysis_jobs where status in ('queued','running'))>=100 then raise exception 'QUEUE_FULL';end if;
 insert into public.ai_analysis_jobs(owner_id,url,domain,visitor_hash) values(account_id,website_url,website_domain,visitor) returning * into job;
 return to_jsonb(job);
end;$$;

create function public.ai_analysis_claim() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare job public.ai_analysis_jobs;
begin
 perform pg_advisory_xact_lock(823715002);
 update public.ai_analysis_jobs set status=case when attempts>=3 then 'failed' else 'queued' end,
 error=case when attempts>=3 then 'The worker was interrupted repeatedly. Saved answers are preserved.' else null end,
 lease=null,lease_until=null,updated_at=now() where status='running' and lease_until<now();
 if (select count(*) from public.ai_analysis_jobs where status='running')>=3 then return null;end if;
 select j.* into job from public.ai_analysis_jobs j where j.status='queued' and j.available_at<=now()
 and not exists(select 1 from public.ai_analysis_jobs r where r.owner_id=j.owner_id and r.status='running')
 order by j.available_at,j.created_at limit 1 for update skip locked;
 if not found then return null;end if;
 update public.ai_analysis_jobs set status='running',lease=gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=attempts+1,updated_at=now() where id=job.id returning * into job;
 return to_jsonb(job);
end;$$;

create function public.ai_analysis_finish(job_id uuid,lock_id uuid,new_status text,new_stage text,new_progress int,new_profile jsonb,failure text,delay_seconds int default 0) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if new_status not in ('queued','complete','failed') or new_progress not between 0 and 100 then raise exception 'invalid job transition';end if;
 update public.ai_analysis_jobs set status=new_status,stage=new_stage,progress=new_progress,profile=coalesce(new_profile,profile),error=failure,
 lease=null,lease_until=null,attempts=0,available_at=now()+make_interval(secs=>greatest(0,least(delay_seconds,60))),updated_at=now()
 where id=job_id and lease=lock_id and status='running' and lease_until>now();
 return found;
end;$$;
revoke all on function public.ai_analysis_enqueue(uuid,text,text,text),public.ai_analysis_claim(),public.ai_analysis_finish(uuid,uuid,text,text,int,jsonb,text,int) from public,anon,authenticated;
grant execute on function public.ai_analysis_enqueue(uuid,text,text,text),public.ai_analysis_claim(),public.ai_analysis_finish(uuid,uuid,text,text,int,jsonb,text,int) to service_role;

create function ai_private.dispatch_analysis() returns void
language plpgsql security definer set search_path='' as $$
declare token text; slots int;
begin
 select greatest(0,3-count(*)) into slots from public.ai_analysis_jobs where status='running' and lease_until>now();
 if slots=0 or not exists(select 1 from public.ai_analysis_jobs where status='queued' and available_at<=now() or status='running' and lease_until<now()) then return;end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='dashboard2_worker_secret';
 if token is null then return;end if;
 for i in 1..slots loop
 perform net.http_post(url:='https://dashboard-2-sandy.vercel.app/api/ai/jobs-worker',headers:=jsonb_build_object('Authorization','Bearer '||token,'Content-Type','application/json'),body:='{}'::jsonb,timeout_milliseconds:=240000);
 end loop;
end;$$;
revoke all on function ai_private.dispatch_analysis() from public,anon,authenticated;
create function public.ai_analysis_wake() returns void language sql security definer set search_path='' as $$select ai_private.dispatch_analysis();$$;
revoke all on function public.ai_analysis_wake() from public,anon,authenticated;
grant execute on function public.ai_analysis_wake() to service_role;
-- Enable only after the worker deployment is verified.
