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
