import {uniqueObservations} from './measurement-quality.js';
export const insightTabs = ['Visibility', 'Mentions & citations', 'Sentiment', 'Sources', 'Topics', 'Query fanout', 'Location'];
export function summarizeAnswers(rows) {
  const total = rows.length;
  const mentions = rows.filter(r => r.mentioned).length;
  const citations = rows.filter(r => r.cited).length;
  const ranked = rows.filter(r => Number.isFinite(r.position) && r.position > 0);
  return { total, mentions, citations, visibility: total ? mentions / total * 100 : null, citationRate: total ? citations / total * 100 : null, position: ranked.length ? ranked.reduce((sum, r) => sum + r.position, 0) / ranked.length : null };
}
export function filterAnswers(rows, { engine = 'All engines', period = 14, topic = 'All topics', type = 'All prompts', location = 'All locations' }, now = new Date()) {
  const cutoff = new Date(now); cutoff.setUTCHours(0, 0, 0, 0); cutoff.setUTCDate(cutoff.getUTCDate() - period + 1);
  return uniqueObservations(rows).filter(r => new Date(r.at) >= cutoff && new Date(r.at) <= now && (engine === 'All engines' || engine === r.engine) && (topic === 'All topics' || topic === r.topic) && (type === 'All prompts' || type === r.type) && (location === 'All locations' || location === r.location));
}
// Synthetic records exist only behind the explicit sample-preview switch. Never persist as observations.
export function sampleAnswers(business, now = new Date()) {
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(now); date.setUTCDate(date.getUTCDate() - (13 - Math.floor(i / 3)));
    const mentioned = i % 5 !== 0 && i % 7 !== 0;
    const cited = mentioned && i % 3 !== 0;
    return { id: `sample-${i}`, at: date.toISOString(), engine: ['ChatGPT Search', 'Google AI Overviews', 'Perplexity API'][i % 3], topic: ['Brand awareness', 'Buying decisions', 'Comparison'][i % 3], type: i % 2 ? 'Unbranded' : 'Branded', prompt: i % 2 ? 'Which providers should a buyer compare in this category?' : `What does ${business.name} offer?`, mentioned, cited, position: mentioned ? i % 4 + 1 : null, sentiment: mentioned ? ['Positive', 'Neutral', 'Negative'][i % 3] : 'Not assessed', location: ['United States', 'United Kingdom', 'India'][i % 3], sources: cited ? [business.url, 'https://example.com/sample-review'] : ['https://example.com/sample-guide'], fanout: i % 3 === 0 ? [`${business.name} features`, `${business.name} alternatives`] : [], answer: `This is a synthetic response for layout preview. It is not an answer collected from an AI engine about ${business.name}.`, competitors: ['Example brand A','Example brand B','Example brand C','Example brand D','Example brand E'].filter((name,k)=>(i+k*3)%(k+3)!==0 && (i+k)%3!==0), competitorMetrics: Object.fromEntries(['Example brand A','Example brand B','Example brand C','Example brand D','Example brand E'].map((name,k)=>[name,{position:1+(i+k)%6,sentiment:['Positive','Neutral','Negative'][(i+k)%3]}])), method: 'Synthetic preview' };
  });
}

export function brandRankings(rows, businessName) {
 if(rows.every(r=>r.at))rows=uniqueObservations(rows);
 const names = [businessName, ...new Set(rows.flatMap(r => r.trackedCompetitors || r.competitors || []))];
 // A saved answer only measures the competitors tracked when it was collected.
 // Requiring every historical answer to cover the union of all later lists can
 // erase the entire report when a business changes its comparison set.
 const results = names.map((name, index) => {
  const measured = index === 0 ? rows : rows.filter(r => r.discoveryComplete || (r.trackedCompetitors || r.competitors || []).includes(name));
  return { name, own: index === 0, sampleSize: measured.length, mentions: measured.filter(r => index === 0 ? r.mentioned : (r.competitors || []).includes(name)).length };
 });
 const comparable = rows.length && rows.every(r=>r.discoveryComplete===true||r.comparisonAssessed!==false);
 const totalMentions = results.reduce((sum, r) => sum + r.mentions, 0);
 return results.map(r => ({ ...r, visibility: r.sampleSize ? r.mentions / r.sampleSize * 100 : null, sov: comparable && totalMentions ? r.mentions / totalMentions * 100 : null })).sort((a,b) => b.mentions - a.mentions);
}

export function reportMetrics(rows, businessName) {
  if(rows.every(r=>r.at))rows=uniqueObservations(rows);
  return brandRankings(rows, businessName).map(brand => {
    const answers = rows.filter(r => brand.own ? r.mentioned : (r.trackedCompetitors || r.competitors || []).includes(brand.name) && r.competitors?.includes(brand.name));
    const values = answers.map(r => brand.own ? { position:r.position, sentiment:r.sentiment } : r.competitorMetrics?.[brand.name]).filter(Boolean);
    const ranked = values.filter(v => Number.isFinite(v.position) && v.position > 0);
    const assessed = values.filter(v => ['Positive','Neutral','Negative'].includes(v.sentiment));
    return {...brand, position:ranked.length ? ranked.reduce((sum,v)=>sum+v.position,0)/ranked.length : null, sentiment:assessed.length ? assessed.reduce((sum,v)=>sum+({Positive:100,Neutral:50,Negative:0}[v.sentiment]),0)/assessed.length : null};
  });
}

export function reportTimeline(rows, businessName, brandNames, metric, cadence = 'Daily') {
 const grouped = new Map();
 rows.forEach(row => {
  const date = new Date(row.at);
  if (cadence === 'Weekly') date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  const key = date.toISOString().slice(0, 10);
  grouped.set(key, [...(grouped.get(key) || []), row]);
 });
 const days = [...grouped].sort(([a], [b]) => a.localeCompare(b));
 const series = brandNames.map(name => ({ name, points: days.map(([date, answers]) => {
  const metrics = reportMetrics(answers, businessName);
  const brand = metrics.find(b => b.name === name);
  let value = brand?.[metric] ?? null;
  // A brand not tracked in these answers has unknown visibility, never zero.
  return { date, value };
 }) }));
 return { days: days.map(([day]) => day), series };
}
