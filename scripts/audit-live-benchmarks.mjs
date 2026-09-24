// Read-only verification of the five-domain pilot. Run with:
// node --env-file=.env.local scripts/audit-live-benchmarks.mjs
import {serverClient} from '../server/cloud-runtime.mjs';
import {evidenceText} from '../server/evidence-normalization.mjs';
import {reportMetrics} from '../src/ai-insights-data.js';

const sites=new Map([
 ['adidas.co.in','adidas IN'],
 ['upliftai.co','Uplift AI'],
 ['framer.com','Framer'],
 ['youtube.com','YouTube'],
 ['searchable.com','Searchable Limited'],
]);
const client=serverClient(process.env);
if(!client)throw Error('Dashboard 2 cloud credentials are unavailable.');
const {data:workspaces,error}=await client.from('ai_collector_workspaces').select('payload').limit(100);
if(error)throw Error('Could not read the benchmark workspaces.');
let failures=0;
for(const [domain,own] of sites){
 const state=workspaces.map(row=>row.payload).find(payload=>payload?.benchmarks?.[domain]);
 if(!state){console.log(JSON.stringify({domain,status:'missing'}));failures++;continue;}
 const benchmark=state.benchmarks[domain];
 const answers=state.answers.filter(row=>row.domain===domain&&row.benchmarkId===benchmark.startedAt&&row.answer.brandAssessment).map(row=>row.answer);
 const badQuotes=[];
 for(const answer of answers)for(const [name,metric] of Object.entries(answer.brandAssessment)){
  for(const field of ['mentionEvidence','recommendationEvidence','sentimentEvidence','positionEvidence']){
   const quote=metric[field];
   if(quote&&!evidenceText(answer.answer).includes(evidenceText(quote)))badQuotes.push({prompt:answer.prompt,brand:name,field});
  }
 }
 const ranking=reportMetrics(answers,own);
 const sources=new Set(answers.flatMap(answer=>answer.sources||[]));
 const summary={domain,status:benchmark.status,completed:benchmark.completed.length,target:benchmark.total,assessedAnswers:answers.length,webGrounded:answers.filter(answer=>answer.webSearchPerformed).length,ownVisibility:ranking.find(brand=>brand.name===own)?.visibility??null,marketBrands:ranking.length,excludedEntities:new Set(answers.flatMap(answer=>answer.excludedEntities||[])).size,uniqueSources:sources.size,badEvidenceQuotes:badQuotes.length,topBrands:ranking.slice(0,5).map(brand=>({name:brand.name,visibility:brand.visibility,mentions:brand.mentions,sampleSize:brand.sampleSize}))};
 console.log(JSON.stringify(summary));
 if(badQuotes.length||answers.length!==benchmark.completed.length||summary.webGrounded!==answers.length)failures++;
}
if(failures)process.exitCode=1;
