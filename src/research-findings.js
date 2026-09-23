import {uniqueObservations} from './measurement-quality.js';
const key=r=>[String(r.prompt).trim().replace(/\s+/g,' ').toLowerCase(),r.at.slice(0,10),r.location||'Not specified',r.language||'Unspecified'].join('|');
export function researchFindings(input){
 const rows=uniqueObservations(input).filter(r=>r.comparisonAssessed===true&&r.brandAssessment);
 const engines=[...new Set(rows.map(r=>r.engine))];
 const common=engines.length>1?rows.filter(r=>engines.every(e=>rows.some(other=>other.engine===e&&key(other)===key(r)))):[];
 const gaps=rows.filter(r=>!r.mentioned&&r.competitors?.length).map(r=>({...r,names:r.competitors.filter(n=>r.brandAssessment[n]?.mentionEvidence)})).filter(r=>r.names.length).sort((a,b)=>b.at.localeCompare(a.at));
 const sources=new Map();for(const r of gaps)for(const url of new Set(r.sources||[])){try{const u=new URL(url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)continue;const item=sources.get(u.hostname)||{domain:u.hostname,answers:[],url};item.answers.push(r);sources.set(u.hostname,item);}catch{}}
 return {total:rows.length,gaps,engines:engines.map(engine=>{const set=common.filter(r=>r.engine===engine);return {engine,total:set.length,mentioned:set.filter(r=>r.mentioned).length,cited:set.filter(r=>r.cited).length};}),sources:[...sources.values()].sort((a,b)=>b.answers.length-a.answers.length)};
}
