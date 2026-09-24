# Dashboard 2 AI Visibility — current implementation

Project: `dashboard-2`, local port 5174, production `https://dashboard-2-sandy.vercel.app/`.
Supabase project: `grpskfvjpnmgkdfuvcll`, Dashboard 2 AI Visibility, Hakam02-doom's Org.

## Implemented workflow

1. Enter a public business website, review its extracted profile and build the competitor baseline.
2. AI Insights calculates visibility, competitor share of voice, evidence-backed sentiment, citations and explicit recommendation positions from collected answers. Data quality shows measurement scope and uncertainty; no empty metric is fabricated.
3. Research includes Your prompts and Prompt research, topic grouping, Active/Proposed/Archived, editable topics/branded classification, bulk selection, search/filter/sort, 16 selectable columns and CSV export.
4. Prompt details show daily trends, engine filtering, measured data tables, brand rankings, citation sources and original response history.
5. Select up to five questions and choose Check page coverage. The reader samples up to 12 same-origin linked public HTML pages. OpenAI assesses the supplied excerpts, and every Covered/Partial result must pass a verbatim-excerpt check. Results expose URL, capture date, pages read and scope. No match means only no match within read pages. Snapshots are reused for seven days; no JavaScript rendering or full-site coverage claim.
6. Select active prompts and configure daily/weekly monitoring for ChatGPT and/or Gemini. Schedules, due jobs, completion and failures persist in Supabase. Jobs run one at a time, using the same assessment pipeline as manual collection.

## Cloud access and persistence

Settings → AI visibility connections contains email-link authentication and Connect monitoring account. The first ownership claim is allowed only from the local Dashboard 2 host with a verified Supabase session. Subsequent remote API calls require that owner, verified server-side. Other authenticated users cannot access the collector.

This installation is a single-owner monitoring workspace, not a multi-tenant SaaS. Businesses, libraries, answers, reviewed identities, coverage, job history and the budget ledger share one private collector store. Business profiles also sync through the existing owner-scoped `ai_businesses` table. Prompt-library writes use revision checks so stale tabs cannot silently overwrite another device.

The local evidence and existing budget counters were migrated without resetting counters. Local and production now use the same Supabase state when server credentials are configured. The `.local-ai` file remains a private historical backup, excluded from both Git and Vercel uploads.

Database state uses a renewable ten-minute lease, owner-only server access and RLS with no client grants. Public/browser roles cannot execute collector-state or worker-secret RPCs. The local-only file fallback uses an exclusive process lock and atomic writes. A storage failure stops collection rather than falling back to a separate budget ledger.

## Budget and collection rules

- SearchAPI: confirmed free account and positive credits before each request; maximum 100 local/cloud cumulative attempts, including failures. No subscription/top-up is purchased.
- OpenAI: one shared lifetime authorization, capped at $15. Each attempt reserves $0.05 before sending; existing reservations count. The configured model is bounded to keep requests below the conservative reservation. Actual token-cost estimates are displayed separately.
- No automatic budget resets, paid SearchAPI access or unlimited retries.
- Same question, business, engine and UTC day reuses completed observations. Cached provider IDs are rejected as new observations.
- A failed scheduled request pauses its schedule. An interrupted job is marked failed after its lease timeout, not automatically retried. Original evidence remains available for inspection.
- Collection locations remain explicitly unspecified when the provider does not return geographic evidence.

## Cloud scheduler

Supabase pg_cron checks every five minutes and dispatches only when an enabled schedule exists. It calls the authenticated `/api/ai/cron` endpoint; the worker processes one due job per invocation. The independent local worker also checks every minute while Vite runs. Shared leases prevent simultaneous workers from double-spending.

The cron bearer secret is held in Supabase Vault and Vercel secret environment settings. Browser clients cannot read or update it. Scheduling does not require the browser to remain open. When no schedule is enabled, no provider request is made.

## Keyword metrics — approved import workflow

The user chose verified CSV imports instead of funding a keyword-data provider. This is the intended supported mode, not an automatic keyword API.

CSV columns: `Prompt,Source,Volume,Difficulty,Date,Location`.
- Prompt and Source required; at least one numeric metric required.
- Volume is nonnegative monthly searches; Difficulty is provider-reported 0–100.
- Date uses YYYY-MM-DD; location and date may remain unspecified.
- Exact normalized prompt matches update the library. Unmatched prompts are reported and skipped; malformed/duplicate rows reject the import before saving.
- Metrics retain source, date and location; exports include provenance. No LLM-generated search-volume estimates or fabricated difficulty values.

## Credentials

Public: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
Server only: `SUPABASE_SERVICE_ROLE_KEY`, `SEARCHAPI_API_KEY`, `OPENAI_API_KEY`, `AI_CRON_SECRET`, `AI_ANALYSIS_BUDGET_USD`.
Never prefix a server credential with VITE_. Values are stored in ignored local environment files and Vercel secret settings. `.env.local`, `.local-ai` and review artifacts are excluded from deployment and Git.

## Validation

The suite tests budgets, evidence verification, prompt metrics, CSV validation, SSRF restrictions, locking, owner checks, revision conflicts, queue idempotency, pausing and failed-job handling. Live verification includes Supabase permissions, account ownership, website coverage and provider observations. Browser bundles are checked against the actual server credentials before release.

Supabase's informational no-RLS-policy notice is intentional for the server-only collector table: no client privileges are granted. The account's existing leaked-password-protection warning is unrelated to the implemented passwordless email-link flow. References: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .

SearchAPI Perplexity endpoint is deprecated (verified September 24 against https://www.searchapi.io/docs/perplexity-api), so it is excluded from runnable choices. Live Gemini collection succeeded and saved an assessed answer alongside ChatGPT evidence. This installation supports these two verified engines.

## Direct Claude and Gemini research

Settings → AI visibility connections shows the two new collectors. Configure server-only
`ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` and `GEMINI_API_KEY` / `GEMINI_MODEL` in ignored
`.env.local` (or production server environment). Choose model IDs supported by your account
and the relevant web-search tool. Restart the preview after changing environment values.
No keys are exposed through status responses. No new live requests were enabled by this update.

After checking provider pricing/billing controls, explicitly set `AI_DIRECT_COLLECTION_ENABLED=true`
and a small `AI_DIRECT_MAX_REQUESTS` allowance. This is a durable, shared lifetime attempt limit,
NOT a dollar spending cap. Timeouts and failures consume an attempt. No automatic retries.
Analysis still requires the existing OpenAI connection and retains its own authorization ledger.
Claude caps web searches at two and output at 2,048 tokens; Gemini caps output at 2,048 tokens,
but may issue multiple searches. Provider billing must be controlled separately.

In Prompt research & tracking, select Claude API or Gemini API, then run selected prompts.
Scheduled collection supports both. Only completed web-grounded answers with citations enter
measurement. API-derived results have distinct engine names, model metadata and original evidence.
They do not represent exact consumer Claude/Gemini app outputs. Research insights below the table
uses saved answers at no additional API cost: observed competitor gaps, matched-question/date/market
engine comparisons and cited-source research leads. It does not infer causality or guarantee rankings.

## Recommendation-to-improvement workflow

AI Insights now shows the explicit recommendation count for unbranded, assessed buyer questions.
Prompt detail shows the same count for its selected engine. Improve → AI Opportunities, Content
Scorecard and Content Gaps read the selected business's saved answers rather than the Uplift sample.
Each question exposes the assessed competitor recommendation excerpt, original answer, citations,
measured recommendation rate and sampled site coverage. Users can save a per-business action and
target page, download an evidence-based Markdown brief, or open a Dashboard 2 content draft.
Mark Published records a baseline timestamp. New observations of the **same prompt and engine**
are compared with those before publication; the UI never claims the content caused a change.
Actions and baselines share the private owner-scoped collector store. Unassessed answers cannot
create an opportunity.

## Perplexity Sonar connector

The direct collector also supports the official Perplexity Sonar API with server-only
`PERPLEXITY_API_KEY` and optional `PERPLEXITY_MODEL` (default `sonar`). It uses a bounded output,
requires a completed answer with source citations, stores the model and original citations, and
never uses SearchAPI's retired Perplexity endpoint. It appears in manual prompt collection and
the scheduler only when `AI_DIRECT_COLLECTION_ENABLED=true` and the shared lifetime request
allowance is positive. The key is not configured in this installation, so no Perplexity call is
made. Perplexity billing is separate from the authorized OpenAI analysis budget. Reference:
https://docs.perplexity.ai/docs/sonar/quickstart .

## Google traffic and search connector

The Traffic view no longer presents fabricated visits. A read-only server adapter accepts
`GOOGLE_SERVICE_ACCOUNT_JSON`, a numeric GA4 property ID and a matching Search Console property
per selected business. It calls GA4 Data API for known AI referrer sessions/landing pages and
Search Console for top organic queries/pages. It labels these as distinct measurements: Google
AI Overview clicks cannot be reliably separated from ordinary Google visits, and no referral
identifies the exact prompt. Property IDs are owner-scoped in the private collector store; the
service-account key stays in server environment settings. Reports are fetched on demand and not
saved in the browser or Git. This Google account currently shows the initial GA4 account-creation
screen and Search Console welcome screen, with no configured account/property to read. Set up
and verify the properties, grant the service-account email read access, then load the report.
References: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
and https://developers.google.com/webmaster-tools/v1/searchanalytics/query .
