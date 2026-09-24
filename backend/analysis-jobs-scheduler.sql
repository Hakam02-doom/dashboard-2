-- Run after deploying and verifying /api/ai/jobs-worker.
select cron.schedule('dashboard2-analysis-queue','* * * * *','select ai_private.dispatch_analysis()');
-- Reports remain in their owner-scoped collector store. Expired operational
-- jobs and their provider journals are removed after 30 days.
create or replace function ai_private.cleanup_analysis_jobs() returns void
language sql security definer set search_path='' as $$
 delete from public.ai_analysis_jobs where status in ('complete','failed') and updated_at<now()-interval '30 days';
$$;
revoke all on function ai_private.cleanup_analysis_jobs() from public,anon,authenticated;
select cron.schedule('dashboard2-analysis-retention','25 3 * * *','select ai_private.cleanup_analysis_jobs()');
