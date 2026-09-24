# Website analysis worker

The URL-entry flow uses `/api/ai/jobs` for admission and status. No provider work runs in these browser requests. Supabase stores the job and dispatches `/api/ai/jobs-worker` with a Vault-held secret. A minute scheduler recovers missed dispatches and expired worker leases. Each worker runs one website/discovery/question/assessment stage, commits it, and yields. The browser can close safely.

Limits: three running jobs globally, one per owner, 100 queued/running jobs, three new websites per browser identity per rolling day, ten per edge-provided IP hash per rolling day. Repeated submissions for an active job or a completed job less than 24 hours old reuse its ID. The shared $25 analysis reservation cap and 100 SearchAPI pilot attempts remain enforced. Raising traffic capacity does not increase those allowances.

Worker invocations are capped at 240 seconds. Queue leases expire after five minutes, with three interrupted attempts allowed. Each collection phase runs at most four paid provider operations in parallel; a request journal stores its response before advancing the report. A restarted step reuses a completed journal response. An interrupted request whose provider outcome is unknown stops for review instead of issuing a possibly duplicate paid call. Completed answer records survive failures. Existing owner-scoped collector leases continue to serialize changes to the same report store.

The queue and provider journals have RLS enabled and no public policies, with all access revoked from anon/authenticated roles. Only the server role can read or mutate them. Status queries filter by the verified browser identity. Status output excludes ownership, IP hashes, and lease tokens. IPs are HMAC-hashed with the server worker secret and never persisted in raw form. Vercel's request header contract: https://vercel.com/docs/headers/request-headers

## Validation

`node --test scripts/*.test.mjs` runs unit and failure-path tests without provider traffic.

The `scripts/analysis-queue-load.mjs` integration test creates and removes temporary test owners and jobs. Run only with the queue empty and the scheduler/dispatch stopped, never against a busy production queue. It requires `D2_QUEUE_LOAD_TEST=1 D2_QUEUE_WORKER_PAUSED=1 node --env-file=.env.local scripts/analysis-queue-load.mjs`. It tests 100 duplicate submissions, 30 concurrent claims, 23 completed jobs, expired leases, stale tokens, admission limits, and HTTP ownership filtering. It does not call AI providers.

## Operations

Queue state is in `ai_analysis_jobs`: status, stage, progress, available_at, lease_until, error. The private scheduler `dashboard2-analysis-queue` wakes every minute. Do not manually clear a live lease. Expired leases are recovered by the next claim. Never replay an ambiguous paid request by deleting its journal row. Keep the provider budget ledger intact. Before raising limits or adding providers, obtain the corresponding spending authorization and run a provider-quota-aware load test; the current tests validate orchestration, not unlimited provider throughput.

## 100-question analysis (September 24)

New queued website analyses target 100 unbranded buyer prompts: 25 per intent
(Discovery, Comparison, Buying decisions, Use cases). Existing 3-question jobs
retain their original target; the Insights expansion button queues the upgrade.
Plans are generated and validated one intent at a time. Existing 24/32-question
plans and already assessed benchmark answers are retained during an upgrade.
Collection alternates intents and each collection worker performs up to four independent paid requests in parallel.
Web search and evidence assessment remain separate phases, bounded by the worker
timeout. Planning remains one request per step. A raw answer is
saved before assessment and only assessed answers enter scores. The provider
journal also wraps OpenAI web collection, including budget-neutral replay.

The authorized shared reservation ceiling is $25 (500 requests at $0.05 each),
not $25 per visitor. A fresh 100-question run normally reserves $10.20: four plan
requests, 100 searches and 100 assessments. Web responses allow at most two tool
calls. The ceiling is cumulative; no usage counters were reset. Scores describe
these sampled answers, not universal visibility or guaranteed accuracy.

## Collection speed

Each website keeps one workspace lease while processing up to four searches or
four assessments concurrently. With three global job slots this permits at most
12 concurrent provider requests from queue workers. All tasks settle before the
lease is released, and snapshots are written sequentially to prevent stale saves
from overwriting newer answers. Journal replay and the atomic shared budget
reservation apply independently to every request. No extra questions, retries,
or increased spending limits are introduced by this optimization.

The onboarding page opens the report after four assessed answers; remaining work
continues in the durable queue and the Insights screen updates as results arrive.
