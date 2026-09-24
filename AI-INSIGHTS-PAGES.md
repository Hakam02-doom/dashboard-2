# AI Insights reference implementation

Reference: the user’s September 24 recording (94.8 seconds) and signed-in Searchable AI Search Insights pages, inspected September 24, 2026. Preserve Dashboard 2 tokens, rounded panels, theme switching, and navigation.

| View | Implemented structure and behavior |
| --- | --- |
| Mentions & Citations | Mention/citation count charts, daily/weekly buckets, line/bar switches, merged view, classified three-stage journey and response drill-down, explicit-rank distribution heatmap, grouped/searchable/filterable/sortable response table, paging, export and full evidence drawer. |
| Sentiment | Per-engine perception excerpts and score, sentiment timeline, competitor head-to-head metrics, evidence-backed attribute treemap/list, brand claims with cloud-saved Correct/Incorrect/Reset reviews. |
| Sources | Top-domain trend chart, content-format distribution, ownership/social filters, domain grouping, URL search, source gaps, usage and equal-period change, evidence and external source links, export. |
| Topics | Topic × engine average-rank heatmap, prompt-weighted visibility tiles/list, top-ten brand rankings with logos, searchable topics, sorted competitive analysis, topic/priority/prompt drawer. |
| Query Fanout | Distinct/total counts, grouped queries, expansion, tracking coverage, add query to active prompt library, sorting/search/paging/export, brand occurrences. |
| Location | Natural Earth vector map with zoom/reset, recorded-region metrics, visibility/sentiment/response selector, equal-period change and response drill-down. |

Measurement rules: no invented history or rankings. Empty dates are not zero-filled. Unassessed sentiment is excluded. Each brand’s visibility uses only answers where that brand was tracked, so changing the competitor set never erases earlier results or treats untracked brands as absent. Share of voice uses measured mentions and should be read with the tracked-set warning when lists vary. Buyer stages and attributes are AI classifications; quotes must match the saved answer and name the brand. Brand facts are claims for user review, not external truth. Review flags do not rewrite provider answers. Source-format metadata and verified geography stay unavailable until collected. The current collector has no verified geographic targeting. Source gaps mean citations in answers that mention a competitor but omit the business; this is not proof a source itself omits the brand. Changes require observations in both comparison periods.

Map data: Natural Earth 1:110m country polygons, public-domain cartographic data, https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson . Display boundaries are geographic context, not visibility measurements.
