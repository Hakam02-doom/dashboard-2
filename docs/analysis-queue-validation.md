# Queue validation — 2026-09-24

- 135 automated tests passed, covering existing features plus staged collection, response journaling, no duplicate reservations, browser reconnect, worker authentication, and failure paths.
- Database integration: 100 simultaneous duplicate submissions produced one job. Thirty concurrent claim attempts obtained three distinct workers for three owners. Twenty-three isolated jobs completed. Expired worker recovery, stale writer rejection, three-sites-per-visitor and ten-sites-per-network admission limits, and cross-owner HTTP filtering passed. Synthetic test data was removed; no AI calls were made.
- Production HTTP admission: 100 parallel requests returned 100 successful responses for the same completed test job, with exactly one job and zero provider requests (3.8 seconds from this machine). Direct queue reads using the browser credential were denied. An initial harness run hit local DNS resolution failure; the rerun reused a resolved TLS hostname connection and passed. This measures admission/idempotency, not 100 simultaneous AI collections.
- Live production: Instagram progressed through website reading, competitor discovery and three assessed buyer questions after navigating away from AI Visibility. Returning opened the completed report with three measured answers and eleven comparison brands. The initial sample showed Instagram in two of three answers. These are observed sample results, not a universal accuracy claim.
- The existing global pilot budget and provider quotas stayed enforced. No allowance was increased. Additional public usage is constrained by those balances.

### 100-prompt expansion

- 141 automated checks pass, including a complete 100-answer simulated run over
  independent handler instances, invalid-plan repair, preservation of legacy
  prompt IDs, budget-cap enforcement, and OpenAI journal replay without charging
  a second reservation.
- Production generated 100 unique Instagram questions, 25 per buyer intent.
  Live generation exposed duplicated questions and an oversized response; the
  validator now filters invalid/duplicate candidates and retains exactly the
  required count. The saved valid responses were reused to finish the plan.
- Collection uses one paid call per queue step, alternating intents; answers and
  assessment are separate persisted steps. The full live run is asynchronous.

### Faster collection

- 145 automated checks pass. The full 100-question fixture uses 50 collection /
  assessment phases instead of 200, with the same 100 searches and 100 evidence
  assessments. Planning calls are unchanged.
- Concurrency tests verify four independent requests overlap, failed siblings do
  not discard successful results, pending answers resume before new searches,
  completed questions are not recollected, and workspace saves never overlap.
- Onboarding opens the report after four assessed answers. It retains the active
  job ID so refresh and background completion remain resumable.

## Pipelined current-site-only analysis

- Four intent planners execute concurrently; cross-intent duplicate validation still runs when merging.
- 100-question simulated run passes through 100 separate searches and 100 evidence assessments, with a rejected planning batch repaired. No completed question is recollected on restart.
- Batch tests verify 24-call overlap, immediate assessment of fast answers before slow sibling searches, saved-answer recovery and preservation of successful siblings on failure.
- Coalesced-save tests verify revision durability, single-writer behavior and failure propagation.
- Current-site tests verify replacing profiles and restoring only the selected site from legacy browser history.
- Production SQL transaction (rolled back) verified duplicate submission reuse, fresh website switch, owner isolation, clearing old answers and unchanged budget counters.
- Supabase was observed RESTARTING during verification and later ACTIVE_HEALTHY. This infrastructure interruption is separate from orchestration timing.
- 100-question fresh provider latency remains unverified. At the database migration, 417 of 500 conservative reservations were already used ($20.85 of the $25 shared allowance). This remaining allowance cannot cover a new 204-call test; the cap was not increased or reset.

Release `fc8e464` passed 151 tests in an isolated checkout (excluding unrelated
local logo/startup edits), the production build, and project-isolation checks.
The new reset function and budget table were verified inaccessible to public
roles. The initial Vercel deployment was blocked by the local Git author email;
the repository author was changed to the primary verified email shown in the
authenticated GitHub account settings before redeployment.
