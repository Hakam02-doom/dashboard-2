const promptKey=r=>String(r.prompt||'').trim().replace(/\s+/g,' ').toLowerCase();
// One observation per prompt, engine, language, market and UTC day.
export function uniqueObservations(rows){
 const seen=new Map(),providerIds=new Set();
 for(const r of rows){
  if(!r.at||!Number.isFinite(Date.parse(r.at)))continue;
  if(!r.prompt||!r.engine){seen.set(r,r);continue;}
  if(r.id){const providerKey=[r.engine,r.id].join('::');if(providerIds.has(providerKey))continue;providerIds.add(providerKey);}
  const key=[promptKey(r),r.engine,r.language||'Unspecified',r.location||'Not specified',r.at.slice(0,10)].join('\u0000');
  if(!seen.has(key)||r.at>seen.get(key).at)seen.set(key,r);
 }
 return [...seen.values()];
}
export function sharedCoverage(rows,names){
 return rows.filter(r=>r.comparisonAssessed!==false&&names.every(n=>(r.trackedCompetitors||r.competitors||[]).includes(n)));
}
export function wilsonInterval(successes,total){
 if(!total)return null;
 const z=1.96,p=successes/total,den=1+z*z/total;
 const mid=(p+z*z/(2*total))/den,half=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/den;
 return [Math.max(0,mid-half)*100,Math.min(1,mid+half)*100];
}
export function measurementQuality(input,business){
 const rows=uniqueObservations(input),names=[...new Set(rows.flatMap(r=>r.trackedCompetitors||r.competitors||[]))];
 const paired=sharedCoverage(rows,names);
 const assessed=rows.filter(r=>typeof r.recommended==='boolean');
 const days=new Set(rows.map(r=>r.at.slice(0,10))).size;
 const prompts=new Set(rows.map(promptKey)).size;
 const engines=[...new Set(rows.map(r=>r.engine))].map(name=>{const subset=rows.filter(r=>r.engine===name);return {name,answers:subset.length,prompts:new Set(subset.map(promptKey)).size,days:new Set(subset.map(r=>r.at.slice(0,10))).size};});
 const warnings=[];
 if(days<3)warnings.push('Fewer than three collection days; short-term variation is not established.');
 if(prompts<30)warnings.push('Fewer than 30 distinct questions; coverage is limited.');
 if(engines.length>1){const sets=engines.map(e=>new Set(rows.filter(r=>r.engine===e.name).map(promptKey)));if(sets.some(set=>set.size!==sets[0].size||[...set].some(p=>!sets[0].has(p))))warnings.push('Engines have different question coverage. Select one engine before comparing scores across time.');}
 if(engines.length<2)warnings.push('Only one AI engine is represented.');
 if(rows.some(r=>r.type==='Branded')&&rows.some(r=>r.type==='Unbranded'))warnings.push('Branded and unbranded questions are mixed. Filter them separately for discovery comparisons.');
 if(paired.length<rows.length)warnings.push('Tracked competitor lists changed across answers. Each brand’s visibility uses only answers where it was tracked; compare trends after the list stays stable.');
 if(rows.some(r=>!r.measurementProfile?.reviewed))warnings.push('Some observations predate identity review.');
 return {total:rows.length,duplicates:input.length-rows.length,days,prompts,engines,warnings,paired:paired.length,
  mentionInterval:wilsonInterval(rows.filter(r=>r.mentioned).length,rows.length),
  recommended:assessed.filter(r=>r.recommended).length,recommendationAssessed:assessed.length,
  recommendationRate:assessed.length?assessed.filter(r=>r.recommended).length/assessed.length*100:null,
  citationRate:rows.length?rows.filter(r=>r.cited).length/rows.length*100:null,
  headToHead:names.map(name=>{const pair=rows.filter(r=>r.comparisonAssessed!==false&&(r.trackedCompetitors||r.competitors||[]).includes(name));let both=0,ownOnly=0,competitorOnly=0,neither=0;for(const r of pair){const other=r.competitors?.includes(name);if(r.mentioned&&other)both++;else if(r.mentioned)ownOnly++;else if(other)competitorOnly++;else neither++;}return {name,total:pair.length,both,ownOnly,competitorOnly,neither};})};
}
