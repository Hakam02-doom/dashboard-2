import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOpportunities,contentBrief,promptKey} from '../src/ai-opportunities.js';
import {normalizeDirect,collectDirect,directConfig,directStatus} from '../server/direct-collectors.mjs';
import {validateSchedule} from '../server/collection-schedule.mjs';
import {searchapiHandler} from '../server/searchapi-handler.mjs';
import {Readable} from 'node:stream';
const business={name:'Acme',domain:'acme.com'};
const prompt='Which tools help small teams publish content?';
const answer=(id,at,recommended=false)=>({id,at,prompt,type:'Unbranded',engine:'ChatGPT Search',answer:'Rival is a useful tool.',sources:['https://rival.example/guide'],competitors:['Rival'],brandAssessment:{Acme:{recommended},Rival:{recommended:true,recommendationEvidence:'Rival is a useful tool.'}},recommended,topic:'Content'});
test('opportunity evidence is scoped to the selected business and never treats missing coverage as a site-wide gap',()=>{
 const rows=[answer('a','2026-09-20T10:00:00Z'),answer('b','2026-09-21T10:00:00Z',true)];
 const result=buildOpportunities({business,answers:rows,coverage:{},actions:{}});
 assert.equal(result.length,1);assert.equal(result[0].priority,'High');assert.equal(result[0].recommended,1);assert.equal(result[0].coverage,null);
 assert.match(contentBrief(result[0],business).pageFinding,/has not been checked/);
 assert.equal(buildOpportunities({business:{name:'Other',domain:'other.com'},answers:[]}).length,0);
 assert.equal(promptKey('  Which   tools?  '),'which tools?');
});
test('published opportunity requires fresh answers before claiming a measured change',()=>{
 const actions={[promptKey(prompt)]:{status:'published',baselineAt:'2026-09-21T12:00:00Z'}};
 const rows=[answer('a','2026-09-20T10:00:00Z')];
 assert.equal(buildOpportunities({business,answers:rows,actions})[0].followup,'Awaiting same-engine collection');
 rows.push(answer('b','2026-09-22T10:00:00Z',true));
 const result=buildOpportunities({business,answers:rows,actions})[0];
 assert.equal(result.followup,'Recommendation rate improved');assert.equal(result.before.length,1);assert.equal(result.after.length,1);
});
test('Perplexity Sonar stores only completed source-grounded answers and never exposes a key in status',async()=>{
 const data={id:'px-1',model:'sonar',choices:[{finish_reason:'stop',message:{content:'Rival is useful.[1]'}}],citations:['https://rival.example/guide'],search_results:[{url:'https://rival.example/guide',title:'Guide',snippet:'Rival tools'}]};
 const config=directConfig({PERPLEXITY_API_KEY:'private',AI_DIRECT_COLLECTION_ENABLED:'true',AI_DIRECT_MAX_REQUESTS:'2'});
 assert.equal(directStatus(config)['perplexity-api'].ready,true);assert.equal(JSON.stringify(directStatus(config)).includes('private'),false);
 const normalized=normalizeDirect(data,'perplexity-api',business,prompt,'sonar');assert.equal(normalized.engine,'Perplexity Sonar');assert.deepEqual(normalized.sources,['https://rival.example/guide']);
 assert.throws(()=>normalizeDirect({...data,citations:[],search_results:[]},'perplexity-api',business,prompt,'sonar'),/grounded/);
 let reserved=false;
 await collectDirect({engine:'perplexity-api',config,business,prompt,reserve:async()=>{reserved=true;},request:async(url,options)=>{assert.equal(reserved,true);assert.equal(url,'https://api.perplexity.ai/v1/sonar');assert.equal(options.headers.Authorization,'Bearer private');assert.equal(JSON.parse(options.body).model,'sonar');return {ok:true,json:async()=>data};}});
 const schedule=validateSchedule({cadence:'weekly',engines:['perplexity-api'],questions:[{text:prompt,topic:'Content',type:'Unbranded'}],enabled:true},business);
 assert.deepEqual(schedule.engines,['perplexity-api']);
});
test('opportunity workflow saves per-business actions and rejects unrelated target pages',async()=>{
 let state={attempts:0,answers:[{domain:business.domain,answer:answer('a','2026-09-20T10:00:00Z')}]};
 const store={kind:'test',load:async()=>state,save:async next=>{state=structuredClone(next);},acquire:async()=> 'lease',release:async()=>{}};
 const handler=searchapiHandler({local:true,store});
 const call=async body=>{const req=Readable.from([JSON.stringify({business,action:'opportunityUpdate',prompt,status:'published',notes:'Publish clearer evidence.',targetUrl:'https://acme.com/guide',...body})]);req.method='POST';req.headers={origin:'http://127.0.0.1:5174',host:'127.0.0.1:5174','content-type':'application/json'};const res={setHeader(){},end(text){this.body=JSON.parse(text);}};await handler(req,res);return res;};
 assert.equal((await call({targetUrl:'https://unrelated.com/guide'})).statusCode,400);
 const saved=await call({});assert.equal(saved.statusCode,200);assert.equal(saved.body.opportunityActions[promptKey(prompt)].status,'published');assert.ok(saved.body.opportunityActions[promptKey(prompt)].baselineAt);
 assert.equal(state.opportunityActions['other.com'],undefined);
});
