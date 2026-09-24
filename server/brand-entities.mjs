const string={type:'string'};
const kind={type:'string',enum:['Market brand','Product or model','Publisher or retailer','Unclear']};
export const entityAuditSchema={type:'object',properties:{entities:{type:'array',items:{type:'object',properties:{name:string,entityKind:kind},required:['name','entityKind'],additionalProperties:false}}},required:['entities'],additionalProperties:false};

export function auditCandidates(answers,suppliedNames){
 const supplied=new Set(suppliedNames.map(name=>name.toLowerCase()));
 const snippets=new Map();
 for(const answer of answers){
  if(!answer.discoveryComplete)continue;
  for(const name of answer.trackedCompetitors||[]){
   if(supplied.has(name.toLowerCase()))continue;
   const excerpt=answer.brandAssessment?.[name]?.mentionEvidence;
   if(!excerpt)continue;
   const list=snippets.get(name)||[];
   if(list.length<3&&!list.includes(excerpt))list.push(excerpt);
   snippets.set(name,list);
  }
 }
 return [...snippets].map(([name,excerpts])=>({name,excerpts}));
}

export function verifyEntityAudit(candidates,assessment){
 if(!Array.isArray(assessment?.entities)||assessment.entities.length!==candidates.length)throw Error('Brand entity audit was incomplete.');
 const names=new Set(candidates.map(item=>item.name));
 const result=new Map();
 for(const item of assessment.entities){
  if(!names.has(item.name)||result.has(item.name)||!kind.enum.includes(item.entityKind))throw Error('Brand entity audit had an unknown or repeated name.');
  result.set(item.name,item.entityKind);
 }
 return result;
}

export function pruneNonMarketBrands(answer,audit,suppliedNames){
 if(!answer.brandAssessment)return answer;
 const supplied=new Set(suppliedNames.map(name=>name.toLowerCase()));
 const rejected=name=>!supplied.has(name.toLowerCase())&&audit.has(name)&&audit.get(name)!=='Market brand';
 const removed=(answer.trackedCompetitors||[]).filter(rejected);
 if(!removed.length)return answer;
 const keep=metrics=>Object.fromEntries(Object.entries(metrics||{}).filter(([name])=>!rejected(name)));
 return {...answer,competitors:(answer.competitors||[]).filter(name=>!rejected(name)),trackedCompetitors:(answer.trackedCompetitors||[]).filter(name=>!rejected(name)),brandAssessment:keep(answer.brandAssessment),competitorMetrics:keep(answer.competitorMetrics),excludedEntities:[...new Set([...(answer.excludedEntities||[]),...removed])],entityAuditVersion:1};
}
