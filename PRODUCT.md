# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
React with Vite, explicitly selected by the user on September 14, 2026.
## Product Purpose
Uplift AI brings SEO research, content creation, publishing, Google Business Profile, social content, and AI visibility into one workspace.
## Users
SEO operators and content teams. The existing dashboard shell uses the LunchLink demo workspace. Independent AI visibility monitoring is initially intended for Uplift AI; its website-specific business context stays separate from the shell and other sections.
## Capabilities and Constraints
Build a reviewable interactive dashboard in this project. Live publishing is not configured. A dedicated Supabase backend has been provisioned for AI visibility, with the four-table foundation schema and row-level security applied. Frontend authentication, cloud synchronization, an answer collector, and scheduled monitoring are not connected; database provisioning does not make measurements live. Source snapshots are historical; any chart series and distributions are illustrative and labeled as demo data. Local interactions must not imply real publishing or generation. Calendar, library, social, and research sections share the dashboard style. Added sample records and schedules are explicitly illustrative; composer and review changes last only for the current session. Library export uses visible filtered rows or selected records. Research retains historical source baselines, and decorative mini-charts do not represent measured trends.
## Brand Commitments
Uplift AI product name and content. The user requires reproduction of the screen inside the laptop at https://dribbble.com/shots/26892320-Healthcare-CRM-Dashboard-UI-Clinexa. Do not use original Uplift AI website images or layouts. This reference is already the selected composition; do not generate alternative designs.
## Evidence on Hand
Product and dashboard source text in /Users/hakam/Documents/Codex/2026-09-13/files-mentioned-by-the-user-screenshot/work/uplift-*-source.txt. Content counts: 108 published assets, 132 tracked keywords, 60 planned social topics, 28 generated post sets. Upcoming article topics and workflow terminology copied from these snapshots. Website: https://www.upliftai.co/.

## AI Visibility Delivery
Website-first onboarding reads a public HTTPS page through the local Node website reader, then lets the user review and edit the business name and description or enter them manually. This is website context, not an AI visibility scan. Business profiles persist on this device by normalized domain; each domain has a separate local prompt library. The original global Uplift AI prompt library remains untouched.

AI Insights is the first workspace group, followed by Research, Evidence, Improve, and Traffic. Its seven views are Visibility, Mentions & citations, Sentiment, Sources, Topics, Query fanout, and Location. Measurements start empty. An explicit sample-preview checkbox enables synthetic answer records, filters, evidence details, and labelled JSON export; these records never write to the backend. Older illustrative Uplift AI tools remain labelled legacy examples. Missing measurements are not zero, website headings are not topic rankings, and model API responses must remain distinct from consumer search results.

Settings reports each connection's actual state: website reader working locally, Supabase backend provisioned but app sign-in/sync unconnected, collection account needed, analysis model pending, and no schedule. The public production website-reader endpoint is disabled until authentication/rate limits are wired. No paid provider calls or deployment have been performed for this delivery. See AI-VISIBILITY-SETUP.md for backend details, reader limits, and remaining delivery gates.

Searchable supplies feature and composition references only. The confirmed approach is independent monitoring; preserve Dashboard 2's aesthetic and do not require a Searchable API connection.
