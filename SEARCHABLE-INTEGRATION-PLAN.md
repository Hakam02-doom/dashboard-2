# Searchable audit and Dashboard 2 integration plan

Research date: 23 September 2026. Target: Dashboard 2 only (`dashboard-2`, preview port 5174).

## Confirmed implementation direction — 23 September 2026

The user selected **independent monitoring for Uplift AI**. This replaces the earlier proposed Searchable-backed/hybrid starting point below. Searchable is a feature reference only; do not request its API key or connect its private project. Build provider adapters and our own durable collection history. Keep API-collected observations explicitly distinguished from consumer ChatGPT, Google AI Overviews or other search surfaces: one cannot stand in for another.

The next stage needs a secure backend with project authentication, database records for prompts/runs/answers/citations, a queued collector, and a budgeted engine adapter. Select and configure supported engine access before enabling live runs. Do not advertise unavailable engines or infer consumer search coverage from raw model API results. Until this is configured, the prompt library remains a local planning tool and existing charts remain illustrative.

## Original recommendation (superseded by the choice above)

Build a real AI visibility workspace using Dashboard 2's existing visual system. Start with a server-side Searchable data connector if the account's entitlement and permitted use support it; add our own workflow storage and narrowly scoped actions. Keep the connector replaceable so an independent collection service can be introduced later.

This is a proposed implementation approach, not a claim about Searchable's internal architecture. The user has requested the plan first. No application changes, provider connections, scans, purchases, or deployment were performed during this audit.

## Audit coverage and confidence

Inspected the public landing page and feature material, official documentation and public OpenAPI specification, and the signed-in Uplift AI project. Visited every main dashboard navigation area and all seven AEO views; inspected prompt detail, research, content modes, knowledge-base sections, agent/skills, and settings for connectors, models, notifications, team, and white-labelling.

Evidence labels below:

- **Observed:** controls and descriptions inspected in the signed-in application. This does not mean a paid or mutating operation was executed.
- **Documented:** official product/API documentation describes it; not necessarily available in this account.
- **Conditional:** gated, unconnected, empty, advertised only, or requires separate access. These are not promises of current end-to-end functionality.

Boundaries: did not run content generation, initiate audits, change prompts, send invitations, enable integrations, create API keys, publish reports, or test checkout. The account has little history; some analytics were empty or still loading. The report builder/editor, connected traffic reports, and paid shopping/advertising screens could not be fully exercised. Notification settings explicitly mark several features as coming soon. This is a comprehensive inventory of the accessible product and published surface, not certification of every vendor behavior.

## 1. Feature inventory and how it works

### A. Visibility measurement

| Feature | Observed operation / purpose | Dashboard 2 treatment |
|---|---|---|
| Visibility | Brand visibility trend, competitor comparison, rankings, average position, share of voice | Replace illustrative totals with provider-backed metrics; retain evidence and sample counts |
| Shared filters | Brand, date range, time granularity, branded/unbranded prompts, model, topic, location | One filter context across related views; show unsupported filters rather than silently ignoring them |
| Mentions and citations | Separate mention and link trends; optional combined chart; third-party-media switch | Preserve the distinction between mentioning a brand, linking its site, and consulting a source |
| Response explorer | Search/group/filter/export responses; mention, citation, position, source, and time columns | Open an evidence drawer with prompt, engine, location, capture date, answer and links |
| Decision journey | Mention rate by funnel stage | Simple stage comparison with denominators, not a fabricated conversion funnel |
| Position distribution | Distribution of brand positions within answers | Compact distribution rows with missing/unranked answers identified |
| Competitors | Rankings, comparison mode, share-of-voice detail | Benchmark selected competitors and allow brand drill-down |

Source: [AEO Insights](https://app.searchable.com/ai-search-insights). The app contains seven views: Visibility, Mentions & Citations, Sentiment, Sources, Topics, Query Fanout, Location.

### B. Sentiment and factual accuracy

Observed sentiment includes positive/neutral/negative proportions, model-specific brand perception, strengths/weaknesses, sentiment history, competitor head-to-head comparison, attributes, and a list of AI-generated brand statements with Correct/Incorrect review controls.

Our implementation: a compact sentiment distribution, an attribute comparison, and a factual-review queue. Keep the original statement and answer evidence; store reviewer, decision, reason, and timestamp. A user correction must not imply the external AI model has been corrected. Generated sentiment and classifications must remain distinguishable from human verification.

Source: [Sentiment](https://app.searchable.com/ai-search-insights?tab=sentiment).

### C. Citation sources and coverage gaps

Observed source analysis includes domain trends, content-type distribution, all cited URLs, domain grouping, search, and gap-analysis actions. Associated Sources registers third-party URLs or domains, tags their type, proposes candidates, and separates their attribution from owned-site citations. Shared social platforms require URL-level attribution.

Our implementation: source-domain leaderboard, URL drill-down, content-type comparison, and owned / associated / competitor / other labels. Candidate sources require review. Do not automatically count every citation from a large review or social domain as a brand citation.

Sources: [Sources](https://app.searchable.com/ai-search-insights?tab=sources), [Associated Sources](https://app.searchable.com/knowledge-base?tab=associated-sources).

### D. Topics, query fanout, and geography

- **Topics — observed:** engine-by-topic position matrix, visibility distribution, competitor rankings, topic analysis and prompt drill-down. Topics can be created, generated, grouped, and archived.
- **Query fanout — observed:** the additional searches captured while an engine answers a prompt; distinct/total counts, prompt breakdown, tracking coverage, brand/product occurrences, common phrases, exports. It is evidence of captured searches, not access to hidden model reasoning.
- **Locations — observed view, limited loaded data:** geographic breakdown of tracked regions; documented location analytics include visibility, sentiment, position and competitive measures.

Our implementation: a labelled heatmap for topics, an expandable prompt-to-query list for fanout, and a ranked location table. A map is optional only when location data makes it useful. Missing engine fanout support must be shown as unavailable.

Sources: [Topics](https://app.searchable.com/ai-search-insights?tab=topics), [Fanout](https://app.searchable.com/ai-search-insights?tab=query-fanout), [Location](https://app.searchable.com/ai-search-insights?tab=location), [fanout API](https://docs.searchable.com/api-reference/query-fanout/get-query-fanout).

### E. Prompt management and research

Observed: a tracked-prompt table with grouping, filters, configurable columns, exports, visibility, rank, sentiment, topics, branded status, volume, difficulty and competitor mentions. A detail drawer contains rankings, source domains, response history, model/date filters and location. Research adds topic management, bulk upload, manual prompts, generated prompts/topics, Active / Proposed / Archived states and suggestion review.

How it works: choose questions relevant to buyers, attach topic/market/brand metadata, run them against supported engines, and accumulate dated observations. Proposed questions are not measured performance. Archiving should preserve history.

Our implementation: support these workflows, but do not confuse a locally saved prompt with one registered for Searchable monitoring. The published REST spec currently does not document prompt-create/update/run endpoints. Initially use a clearly labelled provider handoff or CSV workflow; native tracking needs an approved write API or our own job system.

Sources: [Your Prompts](https://app.searchable.com/prompts), [Prompt Research](https://app.searchable.com/prompts/research), [prompt guide](https://docs.searchable.com/using-searchable/working-with-prompts).

### F. LLM analytics: crawlers and human visitors

Observed navigation: Overview, Pages, AI Crawlers, Visitors, Logs, Setup. The current account is unconfigured and displays illustrative numbers behind setup; those are not measured Uplift AI traffic.

Documented collection: site/CDN request events through hosting integrations or middleware, separately from human AI referrals. Hosting paths include Vercel, Cloudflare, CloudFront, Netlify, Fastly, Akamai, GCP, WordPress, custom middleware and REST ingestion.

Our implementation: crawl timeline, page inventory, bot-category breakdown, human-referral landing pages, filtered request log, sitemap coverage and per-page comparison. Record source and freshness. Install collection on the **business website being measured**, not merely on Dashboard 2's Vercel frontend. A crawler request alone proves neither an answer citation nor a human conversion.

Sources: [LLM Analytics](https://app.searchable.com/ai-traffic), [setup documentation](https://docs.searchable.com/setup/overview), [crawl/referral correlation](https://docs.searchable.com/api-reference/traffic/get-crawl-to-visit-correlation).

### G. Search and website traffic

Observed connectors: Google Search Console, Google Analytics 4, and Bing Webmaster Tools; all are disconnected in this account. GSC provides organic-search measurements, GA4 supplies site/referral behavior, and Bing provides its own search-performance context. These are different datasets, not interchangeable visibility scores.

Our implementation: traffic-source tabs, trends and landing-page tables with attribution method. GSC query opportunities can feed prompt research; GA4 referrals can show human outcomes. Revenue/conversions require configured events and an available data source. We cannot infer the exact ChatGPT prompt behind an ordinary referral session.

Sources: [Traffic](https://app.searchable.com/traffic?tab=gsc), [GSC documentation](https://docs.searchable.com/integrations/google-search-console), [GA4 documentation](https://docs.searchable.com/integrations/google-analytics-4).

### H. Content planning, writing and optimization

Observed content modes: **Write, Plan, Optimize**; suggested tasks, search, folders, tags, statuses and performance columns. The empty library includes illustrative rows. Public feature material describes briefs, an editable canvas, selected-text revision, source-backed drafts, optimization of imported content, exports and readiness scoring.

Our implementation: open Dashboard 2's existing Content Library/editor from AI visibility with the prompt, gap and source evidence attached. Add saved briefs, draft versions, an explicit review state, and a transparent readiness rubric. Scores assess content properties; they do not guarantee citations or ranking gains. Reuse the existing calendar instead of adding a second one.

Sources: [Content workspace](https://app.searchable.com/actions/content), [Content feature](https://www.searchable.com/features/content), [content guide](https://docs.searchable.com/using-searchable/content-generation).

### I. Opportunities

Observed: a nightly-generated opportunity queue with email notification settings, currently empty. Documented opportunities draw on visibility, sentiment, sources, traffic, prompts, audits and articles and are prioritized by impact/source/status.

Our implementation: merge the current AI Opportunities and Content Gaps into one action queue. Each item needs a reason, linked evidence, affected pages/prompts, impact confidence, effort, owner, status and next action. Local workflow status must be labelled separately from upstream state unless a supported write path exists. Recheck underlying evidence after a fix; completing a task is not proof of improved visibility.

Sources: [Opportunities](https://app.searchable.com/actions/opportunities), [opportunities API](https://docs.searchable.com/api-reference/opportunities/list-opportunities).

### J. Site health and issues

Observed: sitemap/page inventory, technical/AEO scores, last-audit timestamps, audit action, issue counts and search/sort controls. Issues are grouped into Technical / Content / AEO, with severity, affected pages, quick-win suggestions and Agent/Copy Prompt actions.

Our implementation: an audit coverage summary, prioritised issue list and page detail. Cover fetch/indexing status, links, metadata, headings, canonicals, structured data, robots directives and content checks. Explain every score. Do not reproduce unsupported uplift promises such as a guaranteed CTR increase. A reported site score must state how many pages were actually audited.

Sources: [Site Health](https://app.searchable.com/on-page/site-health), [Issues](https://app.searchable.com/on-page/issues), [audit guide](https://docs.searchable.com/using-searchable/site-audits).

### K. Knowledge base

Observed sections and required fields:

| Section | Capabilities to retain |
|---|---|
| Brand profile | Name/domain, geographic reach, country/language, positioning/context, aliases, exact matching and disambiguation |
| Competitors | Tracked entities, direct/SERP types, mentions, variations, duplicate review, additional discovered companies |
| Topics | Manual/generated topics, prompt counts, active/archive states |
| Associated Sources | URL/domain attribution, tags, suggestions, bulk import and registry |
| Tone / Writing Style | Writing guidance, auto-detection and context-limit indicator |
| Memory | Persistent brand/strategy context, process-content action and context-limit indicator |
| E-E-A-T | Organization/ownership; editorial policy; authors; first-hand experience; expertise/methodology; authority signals; trust/citations/disclosures; freshness/scope; contact/accountability; schema defaults; testimonials/reviews |

Our implementation: Business Profile remains the canonical brand/author/settings record. AI visibility gets a concise knowledge summary and links to the relevant editor. Add missing structured fields there, with one shared backend record. Imported recommendations or AI-observed facts cannot silently overwrite approved business information.

Source: [Knowledge Base](https://app.searchable.com/knowledge-base).

### L. Assistant and reusable skills

Observed: conversational agent, recent chats, contextual suggested investigations, setup checklist, and reusable Skills with grid/list/search/creator filters and creation entry points. Skills encode repeatable workflows invoked from chat.

Our implementation: an evidence-grounded assistant with saved conversations and a small initial set of workflows: explain a visibility change, compare competitors, investigate missing citations, prepare a brief, and explain a technical issue. Read tools first; preview generated drafts and proposed actions before applying them. Store provenance and tool results. Treat retrieved pages and skill content as data, not permission to run arbitrary actions.

The Searchable agent API is **not** self-service; it requires vendor approval. We can seek that access or build our own tool-using assistant over authorised data. Do not promise a native embedded Searchable agent with an ordinary API key.

Sources: [Agent](https://app.searchable.com/agent), [Skills](https://app.searchable.com/skills), [Agent API access](https://docs.searchable.com/api-reference/agent-api).

### M. Reports, sharing and administration

Observed report workspace: folders, grid/list, blank/template entry points, client-report positioning and export messaging. White-label settings include logo/icon, report name, colors, attribution and custom domain but are gated on this account. Team settings expose invitations, roles, project access, active/pending members. Other settings cover models, usage, projects, API keys and MCP.

Notifications: new-opportunity notifications are available; weekly digests, goal-completion and overnight-task alerts are explicitly **Coming soon** in the current UI, despite broader documentation language.

Our implementation: saved report configurations, real CSV/PDF exports, optional share links with explicit publish/revoke controls, workspace/project authorization, connection health and usage visibility. Add scheduled delivery only after a scheduler and delivery service exist. Public reports must be deliberate; internal reports remain private.

Sources: [Reports](https://app.searchable.com/reports), signed-in Account Settings; [MCP documentation](https://docs.searchable.com/integrations/mcp).

### N. Connector inventory

Observed catalog: **GA4, GSC, Bing Webmaster Tools, Looker Studio (Scale+), Shopify, Webflow, WordPress, G2, GitHub, Notion**. Their purposes span analytics, CMS publishing, reviews and agent source material. API keys and MCP are separate integration surfaces.

Public pages also advertise HubSpot, Salesforce, Slack, Framer, PostHog, Sanity and Contentful in various contexts. Their availability and exact workflows were not verified in the signed-in catalog. Some older integration docs list now-visible connectors as coming soon; the current UI and a tested API contract should take precedence over general marketing copy.

Our implementation sequence: Searchable read connector; GA4/GSC and business-site logs; then the CMS actually used by the business; remaining connectors as individually scoped adapters. Do not add connected badges or working-looking buttons for unsupported integrations.

Sources: signed-in Settings → Connectors; [public features](https://www.searchable.com/features), [integration guide](https://docs.searchable.com/integrations/overview).

### O. Additional documented tools outside this account's main navigation

- **AI shopping:** product appearances, competing products/brands, merchant coverage, prompt activation and product detail. Public API is plan/data dependent. Add an optional Commerce view when relevant to the business.
- **AI ads:** advertisers, captured creatives, ad-bearing prompts and frequency trends. These are sampled appearances in collected answers, not actual campaign impressions, spend, CTR or ROAS.
- **Domain authority:** documented external-provider authority snapshot/history. Requires a data source; it is not an AI visibility measure.
- **Diagnostic API:** packaged investigations for visibility decline, competitive position and citation gaps.
- **Free visibility report:** domain/brand onboarding report; suitable as a future acquisition/onboarding tool.
- **AI shopping readiness checker:** public offer includes protocol detection, product schema, trust pages and checkout-flow checks. Treat as a later commerce audit; any checkout testing should stop before an actual order and require an approved test context.
- **Public citation datasets:** broader cross-engine/category benchmarks. Link/reference separately from private project performance; redistribution and coverage need verification.
- **Learning/support ecosystem:** guides, learning center, changelog, support, community and enterprise services. These are support/product offerings, not new AI analytics tabs.

Sources: [Shopping](https://www.searchable.com/features/shopping), [shopping API](https://docs.searchable.com/api-reference/shopping/get-shopping-visibility-summary), [Ads API](https://docs.searchable.com/api-reference/ads/list-ai-ad-advertisers), [free report](https://www.searchable.com/free-visibility-report), [shopping checker](https://www.searchable.com/ucp-readiness), [public data](https://www.searchable.com/data).

## 2. Important findings and implementation risks

1. Dashboard 2 currently uses illustrative AI metrics and local-device persistence. Real integration requires backend authentication, authorization, secrets and durable storage—not only new React tabs.
2. Searchable's trial UI exposes base models ChatGPT, AI Overviews and Perplexity; other engines are add-ons after trial. Public documentation describes broader coverage. Check actual entitlements before promising all engines.
3. API entitlement descriptions differ between public pricing and general API documentation. Confirm the current account's access and permitted embedded use; do not purchase or upgrade automatically.
4. The downloaded official OpenAPI spec contains **73 paths**, including 72 GET operations and 3 POST operations. The POST operations are report generation, audit initiation and sitemap refresh. It does not document native write APIs for prompt/topic/competitor editing, content publishing or brand-fact review. This is the key boundary for an API-backed first release.
5. Several associated-source suggestions appeared unrelated to Uplift AI. Keep human review, aliases, disambiguation and evidence inspection; never treat candidate matching as verification.
6. Site Health had many never-audited pages. One good page score cannot represent complete coverage.
7. Prompt inventory and model-usage counters did not agree during inspection. Preserve source timestamps and investigate inconsistencies instead of inventing reconciliation.
8. Some API outputs use different windows or meanings: share-of-voice changes can be day-over-day; competitor mention totals can be all-time; answer text can be truncated. Normalize carefully and label the actual definition.

Technical references: [API usage](https://docs.searchable.com/advanced/api-usage), [OpenAPI specification](https://docs.searchable.com/api-reference/openapi.json), [raw answers](https://docs.searchable.com/api-reference/answers/list-raw-ai-responses-for-a-prompt), [pricing](https://www.searchable.com/pricing).

## 3. Dashboard 2 information architecture

Use six main AI visibility destinations with a second-level tab row inside each. Preserve the existing sidebar, header, colors, light/dark behavior, Inter typography, rounded surfaces, spacing and restrained chart motion. No imported Searchable components or layouts.

| Main destination | Inner views | Existing feature mapping |
|---|---|---|
| Overview | Performance, engines, competitors, locations | Overview + Share of Voice |
| Research | Tracked prompts, suggestions, topics, query fanout | Expand Keyword Discovery; keep traditional keyword metrics explicitly sourced |
| Evidence | Responses, citations/sources, sentiment, brand facts | Expand Citation Tracker |
| Improve | Opportunities/gaps, content readiness, site health, issues | Merge duplicate opportunity/gap concepts; extend Content Scorecard |
| Traffic | AI visitors, crawlers, pages, logs, search performance, setup | Replace illustrative AI Traffic |
| Reports | Saved reports, exports, sharing; optional Commerce / Ads modules via contextual navigation | New capabilities |

Assistant is a contextual drawer, not a seventh crowded tab. Knowledge and Connections are utilities, with shared Business Profile/Settings editors. Commerce and Ads should not clutter a service-business overview; make them discoverable and capability-aware.

Visual diversity: one primary trend on Overview; topic heatmap; competitor ranked bars; sentiment diverging distribution; source leaderboard; fanout expandable tree; issue severity rows; crawl calendar/activity chart; visitor landing-page table. Use labels and exact values, with table alternatives and accessible keyboard controls. Avoid repeating four metric cards plus the same chart in every tab.

## 4. Real implementation options

| Approach | What becomes real | Limitations |
|---|---|---|
| Searchable-backed reporting | Existing measured visibility, prompts, sources, sentiment, competitors, audits, opportunities and supported traffic | Ongoing Searchable entitlement; incomplete public write surface; vendor data availability and permitted-use review |
| Independent platform | Full control over prompt scheduling, data collection and workflows | Requires licensed collection/model providers, crawl workers, extraction, storage, billing and ongoing maintenance |
| Recommended staged hybrid | Searchable reads first; our own review/tasks/briefs; independent capabilities added behind the same adapter interface | Must label ownership and avoid pretending local changes synchronize upstream |

An independent model API response is not automatically equivalent to the consumer ChatGPT/AI Mode experience. Record the collection surface and methodology. For unsupported consumer engines, select a provider that can legally and reliably capture them; do not automate the user's logged-in browser as the production backend.

## 5. Proposed architecture and data model

Keep React/Vite on the existing Vercel project. Add authenticated server endpoints for the provider adapter and workflow operations. Provider secrets remain server-side, never in `VITE_*`, localStorage, or the public bundle. Add managed PostgreSQL, authentication, durable object storage for exports/evidence where needed, and a queue/worker for long-running collection/crawls. Exact infrastructure selection follows the provider decision.

Core records: workspaces, members/roles, projects/verified domains, provider connections, brand profiles/aliases, competitors, topics, prompts, monitoring configurations, collection runs, answer observations, entity mentions, citations/source uses, fanout queries, sentiment labels, fact reviews, source registry, pages, audits/issues, opportunities/tasks, briefs/content versions, traffic aggregates, reports/shares, assistant conversations/skills, job and audit logs.

Every measurement stores provider, external ID, project, observed time, fetched time, collection window, model/surface, market, status, sample size and provenance. Unique provider IDs make sync idempotent. Store only necessary raw request data and apply retention/redaction. Tenant authorization must protect each query and export.

API strategy: server validates project/filter access → reads cache or provider → validates/normalizes response → returns typed data with freshness/capabilities → UI renders. Use pagination, request coalescing, retry/backoff, cancellation, and partial-failure states. Long jobs return IDs/progress, not a falsely completed success toast.

## 6. Measurement contract

- Define measured unit before computing a percentage: prompt, successful answer observation, entity mention, or citation event.
- For our own presence rate: qualifying responses mentioning the brand / successful eligible responses. Show numerator, denominator and filters. Never quietly substitute this for a vendor's proprietary visibility score.
- For our own citation rate: qualifying responses linking an owned/approved source / successful eligible responses, with ownership classes separated.
- Average rank includes only ranked mentions; show missing/not-mentioned coverage separately.
- Share of voice requires a defined competitor/entity set and consistent window. Membership changes can change the denominator.
- Sentiment must show the classified sample and uncertainty/unclassified count.
- Time deltas must disclose day-over-day versus equal-length prior period and percentage points versus relative percent.
- Keep crawler hits, source consultations, inline citations, human referrals and conversions separate. Correlation is not a proven causal path.
- Keyword search volume is a provider estimate for search keywords, not measured demand for an exact AI prompt.
- No connection, no data, unsupported, plan-limited, stale, partial and failed are distinct states. None should display as a fabricated zero.

## 7. Delivery plan and acceptance gates

| Phase | Deliverable | Done when |
|---|---|---|
| 0 — Access and scope | Confirm Searchable-backed vs independent approach, measured domain, account capabilities, data rights, budget and credentials setup | A read-only server-side test retrieves one authorised project; capability matrix is recorded |
| 1 — Foundation | Auth/project isolation, provider adapter, storage, shared filters, freshness/error states | No secrets in frontend; tenant access tests pass; real data can be compared with its source |
| 2 — Core visibility | Overview, prompts, evidence, sources, competitors, sentiment, topics/location/fanout | Each metric drills into supporting records; filters/export/pagination work; missing data remains honest |
| 3 — Action workflows | Opportunity queue, fact/source review, Business Profile integration, briefs/content readiness | Work persists across devices; upstream versus local state is explicit; no duplicate library/calendar |
| 4 — Technical and traffic | Site audits/issues, authorised site logs, GA4/GSC/Bing as supported, page correlations | Verified business domain receives real events; crawl/citation/referral distinctions are tested |
| 5 — Assistant and reporting | Evidence-grounded chat/skills, report exports and deliberate sharing; supported publishing adapters | Responses cite evidence; actions are previewable; shares revoke; jobs/delivery failures are visible |
| 6 — Advanced parity | Commerce, Ads, extra connectors, white-label, advanced automation and independent collection where needed | Each capability has real data, entitlement and end-to-end validation; unavailable features are labelled |
| 7 — Release | Staged preview, regression review, GitHub push and Vercel production deployment | All checks below pass; production identity and deployed commit match |

Phases are dependency-based, not promises of a fixed delivery date. The full independent platform is a substantial backend project; a real read-only connector release is materially smaller. Do not call the complete integration finished at phase 2.

## 8. Verification and deployment

Test provider payload normalization, metric denominators/date ranges, pagination, incomplete results, revoked credentials, rate limits, project isolation, import validation, job retries and idempotent writes. Integration tests should use controlled fixtures plus an authorised real read smoke test. Verify review→brief→library and prompt→response→source flows.

Review light/dark themes, existing Dashboard 2 typography, mobile navigation, keyboard/focus behavior, reduced motion, empty/error/loading states and large datasets. Confirm Home, Content Library, Social Media, Business Profile and Calendar remain intact.

Before publication: run `npm run check:project`, `npm run build`, `npm run test:isolation`, and the new integration tests. Verify `git remote -v` is `Hakam02-doom/dashboard-2` and `.vercel/project.json` is `dashboard-2`. Use a Vercel preview with isolated credentials/data, then push the reviewed commit and run the project's `npm run deploy`. Smoke-test production auth, real reads and key workflows. Retain the previous deploy and use reversible database migrations for rollback.

Production remains [Dashboard 2](https://dashboard-2-sandy.vercel.app/). No deployment is appropriate yet because this turn produces the requested research and plan, not an implemented integration.

## 9. Decisions needed before implementation

1. Provider strategy: use the existing Searchable account, build independently, or start with the recommended hybrid.
2. Which business/domain should the first live workspace measure? Searchable currently shows Uplift AI; Dashboard 2 also contains LunchLink demo data. They must not be merged accidentally.
3. Secure server-side access and confirmed entitlements. Do not paste keys into chat or commit them.
4. Access to analytics/hosting for the measured site; optional CMS access only when publishing is in scope.
5. Monthly data/model/hosting budget, monitoring cadence, prompt count, markets and required engines. For independent collection, runs scale approximately as prompts × engines × markets × runs per day × days, plus retries and extraction costs.

These decisions do not prevent planning or local UI scaffolding, but they do determine whether deployed analytics can truthfully be described as live.

## 10. First local delivery — 23 September 2026

The user approved adding features one by one while retaining Dashboard 2's design, with connector controls in Settings. A provider-independent local first step is implemented before the live-data phases above:

- Existing AI visibility views are preserved under Overview, Research, Evidence, Improve and Traffic groups.
- Research now includes a prompt library: curated Uplift AI starter suggestions, local save/edit, multiline entry, duplicate protection, topic/type classification, search/filter, archive/restore and CSV export.
- Saved questions persist in this browser under `d2-ai-prompt-library-v1`; this is not server storage or live prompt registration. Invalid stored data is not overwritten.
- Settings describes the requirements for independent AI monitoring, GA4, Search Console and website request logs. The AI monitoring row has no Searchable API dependency. No connector is authenticated; no API keys are collected in the frontend.
- Existing illustrative analytics remain explicitly illustrative. No Searchable results or LunchLink account data have been imported.

This first delivery does **not** complete the production Foundation phase: authentication, tenant isolation, backend storage, provider adapter, live monitoring and deployment remain pending. Next dependency: configure engine access, a collection budget and secure backend storage for the confirmed independent Uplift AI monitor.


## 11. Website intake and AI Insights foundation — 23 September 2026

This status supersedes section 10's navigation/storage/connection descriptions. Earlier inventory, architecture, and phase tables remain research and proposed scope; they are not a list of shipped features.

- Website-first onboarding now reads one public page locally, offers editable business metadata and manual entry, and stores profiles by normalized domain. Prompt libraries are domain-scoped; the original global library is untouched.
- AI Insights replaces Overview as the first main group. Its seven views are Visibility, Mentions & citations, Sentiment, Sources, Topics, Query fanout, and Location. Research, Evidence, Improve, and Traffic retain the existing tools, with older Uplift AI analytics labelled as legacy examples.
- Live measurements remain empty. Opt-in synthetic previews support filters, answer evidence, and labelled sample JSON export. Sentiment bars scale proportionally from zero. Preview data is never written to the backend.
- A dedicated Supabase project was created after the user confirmed the $0/month creation quote. The foundation migration creates four RLS-protected tables for businesses, prompts, runs, and answers. App authentication/cloud synchronization, a provider collector, and scheduling are not connected.
- Settings now shows the actual status of each essential and optional connection. No paid provider call or deployment occurred in this delivery. The production website-reader endpoint remains disabled pending authentication/rate limits.

See AI-VISIBILITY-SETUP.md for the provisioned project, access boundaries, reader limits, and next gates. This is local UI plus database foundation work; it does not complete the production Foundation or Core visibility acceptance gates. The next steps are authenticated app persistence, authorized provider access with a budget, one real evidence-backed collection, and then scheduling and release validation.
