import {canonicalPageTitleName} from './brand-identity.mjs';
import {namedEvidence} from './evidence-normalization.mjs';
import {answerPosition} from './answer-position.mjs';

// Repair a page-title identity from the collected text, without collecting new
// answers or inventing sentiment/recommendation judgments that were not saved.
export function normalizeObservedIdentity(row,business){
 if(!row.brandAssessment)return row;
 const own=canonicalPageTitleName(business.name,business.domain);
 const names=Object.keys(row.brandAssessment);
 const titleNames=names.filter(name=>name!==own&&canonicalPageTitleName(name,business.domain)===own);
 if(!titleNames.length)return row;
 const metrics={...row.brandAssessment};
 let ownMetric=metrics[own]||metrics[titleNames[0]];
 for(const name of titleNames)delete metrics[name];
 const mentioned=namedEvidence(row.answer,own);
 const excerpt=mentioned?String(row.answer).split(/\n+/).find(line=>namedEvidence(line,own))||'':'';
 const rank=mentioned?answerPosition(row.answer,[own]):null;
 ownMetric={...ownMetric,mentionEvidence:mentioned?(ownMetric.mentionEvidence||excerpt):'',position:rank?.position??null,positionEvidence:rank?.evidence||''};
 metrics[own]=ownMetric;
 const canonical=name=>titleNames.includes(name)?own:name;
 return {...row,mentioned,position:ownMetric.position,sentiment:mentioned?ownMetric.sentiment:'Not assessed',recommended:mentioned?ownMetric.recommended:null,
  competitors:[...new Set((row.competitors||[]).map(canonical))].filter(name=>name!==own),
  trackedCompetitors:[...new Set((row.trackedCompetitors||[]).map(canonical))].filter(name=>name!==own),
  brandAssessment:metrics,competitorMetrics:metrics,comparisonAssessed:row.discoveryComplete===true||row.comparisonAssessed,
  identityCorrection:{from:titleNames,to:own,method:'Domain-confirmed title prefix and collected answer text'}};
}
