export const promptKey = value => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

export function buildOpportunities({answers = [], coverage = {}, actions = {}, business} = {}) {
  if (!business?.domain) return [];
  const groups = new Map();
  for (const row of answers) {
    if (!row?.brandAssessment || row.type === 'Branded' || !row.prompt || !row.at) continue;
    const key = promptKey(row.prompt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups].map(([key, records]) => {
    records.sort((a, b) => a.at.localeCompare(b.at));
    const latest = records.at(-1), recommended = records.filter(r => r.recommended === true).length;
    const competitors = [...new Set(records.flatMap(r => (r.competitors || []).filter(name => r.brandAssessment?.[name]?.recommended === true)))];
    const competitorsMentioned = [...new Set(records.flatMap(r => r.competitors || []))];
    const missed = records.length - recommended;
    const page = coverage[latest.prompt] || Object.entries(coverage).find(([text]) => promptKey(text) === key)?.[1] || null;
    const evidence = [...records].reverse().find(r => r.recommended !== true && (r.competitors?.length || r.sources?.length)) || latest;
    const action = actions[key] || {};
    const baselineAt = action.baselineAt || null;
    const before = baselineAt ? records.filter(r => r.at <= baselineAt) : [];
    const comparableEngines=new Set(before.map(r=>r.engine));
    const after = baselineAt ? records.filter(r => r.at > baselineAt && comparableEngines.has(r.engine)) : [];
    const followup = !baselineAt ? null : !after.length ? 'Awaiting same-engine collection' :
      after.filter(r => r.recommended === true).length / after.length > before.filter(r => r.recommended === true).length / Math.max(1, before.length) ? 'Recommendation rate improved' :
      after.filter(r => r.recommended === true).length / after.length < before.filter(r => r.recommended === true).length / Math.max(1, before.length) ? 'Recommendation rate declined' : 'No measured change';
    const priority = missed && competitors.length ? 'High' : missed ? 'Medium' : 'Monitor';
    return {key,prompt:latest.prompt,topic:latest.topic||'General',priority,observations:records.length,recommended,missed,competitors,competitorsMentioned,coverage:page,evidence,latestAt:latest.at,action,followup,before,after,engines:[...new Set(records.map(r=>r.engine))],sourceUrls:[...new Set(records.flatMap(r=>r.sources||[]))].slice(0,5)};
  }).sort((a,b)=>({High:0,Medium:1,Monitor:2})[a.priority]-({High:0,Medium:1,Monitor:2})[b.priority] || b.latestAt.localeCompare(a.latestAt));
}

export function contentBrief(opportunity,business){
  const page=opportunity.coverage;
  return {
    title:`Answer: ${opportunity.prompt}`,
    question:opportunity.prompt,
    audience:business?.name||'Your business',
    targetUrl:opportunity.action.targetUrl||page?.url||'',
    evidence:`${opportunity.recommended}/${opportunity.observations} collected answers recommended ${business.name}. ${opportunity.competitors.length?`Other recommended brands: ${opportunity.competitors.join(', ')}.`:''}`,
    pageFinding:page?`${page.status}: ${page.reason||page.scope||'Review the sampled website pages.'}`:'Website page coverage has not been checked for this question.',
    checklist:['Answer the buyer question directly near the top.','Verify claims and show concrete product evidence.','Include relevant comparisons and clear selection criteria.','Link to the best existing page and useful primary sources.','Publish, then collect the same question on the same AI engines after the update.'],
  };
}
