-- Dashboard 2 only. Independent monitoring; no Searchable account dependency.
create table public.ai_businesses (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 domain text not null check (length(domain) between 3 and 253),
 name text not null check (length(name) between 1 and 100),
 profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile) = 'object'),
 created_at timestamptz not null default now(),
 unique(owner_id, domain)
);
create table public.ai_prompts (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.ai_businesses(id) on delete cascade,
 question text not null check (length(question) between 1 and 500),
 topic text not null default 'General',
 prompt_type text not null check (prompt_type in ('Branded','Unbranded')),
 status text not null default 'saved' check (status in ('saved','active','archived')),
 created_at timestamptz not null default now()
);
create unique index ai_prompts_business_question on public.ai_prompts (business_id, lower(btrim(question)));
create table public.ai_runs (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.ai_businesses(id) on delete cascade,
 provider text not null,
 engine text not null,
 collection_method text not null,
 status text not null check (status in ('queued','running','complete','partial','failed')),
 requested_at timestamptz not null default now(),
 completed_at timestamptz,
 error_code text,
 cost_usd numeric(12,6) check (cost_usd >= 0)
);
create index ai_runs_business_time on public.ai_runs (business_id, requested_at desc);
create table public.ai_answers (
 id uuid primary key default gen_random_uuid(),
 run_id uuid not null references public.ai_runs(id) on delete cascade,
 prompt_id uuid references public.ai_prompts(id) on delete set null,
 prompt_text text not null,
 answer_text text not null,
 captured_at timestamptz not null,
 source_urls jsonb not null default '[]'::jsonb check (jsonb_typeof(source_urls) = 'array'),
 brand_mentioned boolean,
 brand_cited boolean,
 brand_position numeric check (brand_position > 0),
 sentiment text check (sentiment in ('positive','neutral','negative','unassessed')),
 location text,
 topic text,
 fanout_queries jsonb check (jsonb_typeof(fanout_queries) = 'array'),
 provider_record_id text
);
create index ai_answers_run on public.ai_answers(run_id);
create index ai_answers_prompt on public.ai_answers(prompt_id);
alter table public.ai_businesses enable row level security;
alter table public.ai_prompts enable row level security;
alter table public.ai_runs enable row level security;
alter table public.ai_answers enable row level security;
create policy business_owner_select on public.ai_businesses for select to authenticated using (owner_id = (select auth.uid()));
create policy business_owner_insert on public.ai_businesses for insert to authenticated with check (owner_id = (select auth.uid()));
create policy business_owner_update on public.ai_businesses for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy prompt_owner_select on public.ai_prompts for select to authenticated using (exists(select 1 from public.ai_businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy prompt_owner_insert on public.ai_prompts for insert to authenticated with check (exists(select 1 from public.ai_businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy prompt_owner_update on public.ai_prompts for update to authenticated using (exists(select 1 from public.ai_businesses b where b.id = business_id and b.owner_id = (select auth.uid()))) with check (exists(select 1 from public.ai_businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy run_owner_read on public.ai_runs for select to authenticated using (exists(select 1 from public.ai_businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy answer_owner_read on public.ai_answers for select to authenticated using (exists(select 1 from public.ai_runs r join public.ai_businesses b on b.id=r.business_id where r.id=run_id and b.owner_id = (select auth.uid())));
-- Clients may plan questions; only a server-side collector can create measured runs or answers.
revoke all on public.ai_businesses, public.ai_prompts, public.ai_runs, public.ai_answers from anon, authenticated;
grant select, insert, update on public.ai_businesses, public.ai_prompts to authenticated;
grant select on public.ai_runs, public.ai_answers to authenticated;
grant all on public.ai_businesses, public.ai_prompts, public.ai_runs, public.ai_answers to service_role;
