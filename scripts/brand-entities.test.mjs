import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {auditCandidates,verifyEntityAudit,pruneNonMarketBrands} from '../server/brand-entities.mjs';
import {searchapiHandler} from '../server/searchapi-handler.mjs';
import {localCollectorStore} from '../server/collector-store.mjs';

test('entity audit removes shoe models without removing their parent market brands',()=>{
 const row={discoveryComplete:true,competitors:['Nike','Nike Pegasus 41','Samba'],trackedCompetitors:['Nike','Nike Pegasus 41','Samba','PUMA'],brandAssessment:{'adidas IN':{},Nike:{mentionEvidence:'Nike Pegasus 41 is a running shoe.'},'Nike Pegasus 41':{mentionEvidence:'Nike Pegasus 41 is a running shoe.'},Samba:{mentionEvidence:'Adidas Samba is a lifestyle sneaker.'},PUMA:{}},competitorMetrics:{Nike:{},'Nike Pegasus 41':{},Samba:{},PUMA:{}}};
 const supplied=['adidas IN','PUMA'];
 const candidates=auditCandidates([row],supplied);
 assert.deepEqual(candidates.map(c=>c.name),['Nike','Nike Pegasus 41','Samba']);
 const audit=verifyEntityAudit(candidates,{entities:[{name:'Nike',entityKind:'Market brand'},{name:'Nike Pegasus 41',entityKind:'Product or model'},{name:'Samba',entityKind:'Product or model'}]});
 const cleaned=pruneNonMarketBrands(row,audit,supplied);
 assert.deepEqual(cleaned.competitors,['Nike']);
 assert.deepEqual(cleaned.trackedCompetitors,['Nike','PUMA']);
 assert.deepEqual(Object.keys(cleaned.brandAssessment),['adidas IN','Nike','PUMA']);
 assert.deepEqual(cleaned.excludedEntities,['Nike Pegasus 41','Samba']);
 assert.throws(()=>verifyEntityAudit(candidates,{entities:[{name:'Nike',entityKind:'Market brand'}]}),/incomplete/);
});

test('collector audits saved answer entities without recollecting AI answers',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'d2-entities-'));
 const business={name:'adidas IN',domain:'adidas.co.in'};
 const row={id:'web-1',at:new Date().toISOString(),prompt:'Which running shoes are good?',engine:'OpenAI Web Search',answer:'Nike Pegasus 41 is a running shoe from Nike.',mentioned:false,discoveryComplete:true,comparisonAssessed:true,assessmentAliases:{'adidas IN':['adidas']},competitors:['Nike','Nike Pegasus 41'],trackedCompetitors:['PUMA','Nike','Nike Pegasus 41'],brandAssessment:{'adidas IN':{},PUMA:{},Nike:{mentionEvidence:'Nike Pegasus 41 is a running shoe from Nike.'},'Nike Pegasus 41':{mentionEvidence:'Nike Pegasus 41 is a running shoe from Nike.'}},competitorMetrics:{PUMA:{},Nike:{},'Nike Pegasus 41':{}}};
 const store=localCollectorStore(directory);
 try{
  await store.save({attempts:0,answers:[{domain:business.domain,answer:row}],competitors:{[business.domain]:['PUMA']}});
  const request=async(url)=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({entities:[{name:'Nike',entityKind:'Market brand'},{name:'Nike Pegasus 41',entityKind:'Product or model'}]})}}],usage:{prompt_tokens:100,completion_tokens:40}})});
  const handler=searchapiHandler({local:true,analysisKey:'test',analysisBudget:15,store,request});
  const req=Readable.from([JSON.stringify({action:'auditEntities',business})]);req.method='POST';req.headers={origin:'http://127.0.0.1:5174',host:'127.0.0.1:5174','content-type':'application/json'};
  const res={setHeader(){},end(x){this.body=JSON.parse(x);}};await handler(req,res);
  assert.equal(res.statusCode,200);assert.equal(res.body.entityAudit.status,'complete');
  assert.deepEqual(res.body.answers[0].competitors,['Nike']);
  assert.deepEqual((await store.load()).answers[0].answer.excludedEntities,['Nike Pegasus 41']);
 }finally{await rm(directory,{recursive:true});}
});

test('one bounded entity review covers a broad competitor field',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'d2-entities-wide-'));
 const business={name:'Example AI',domain:'example.ai'};
 const names=Array.from({length:40},(_,i)=>`Brand ${i+1}`);
 const row={id:'web-wide',at:new Date().toISOString(),prompt:'Which vendors?',engine:'OpenAI Web Search',answer:names.join(', '),mentioned:false,discoveryComplete:true,comparisonAssessed:true,competitors:names,trackedCompetitors:names,brandAssessment:Object.fromEntries(names.map(name=>[name,{mentionEvidence:name}])),competitorMetrics:Object.fromEntries(names.map(name=>[name,{}]))};
 const store=localCollectorStore(directory);
 try{
  await store.save({attempts:0,answers:[{domain:business.domain,answer:row}]});
  let analyses=0;
  const request=async(_url,options)=>{analyses++;const input=JSON.parse(JSON.parse(options.body).messages[1].content);assert.equal(input.candidates.length,40);return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({entities:input.candidates.map(item=>({name:item.name,entityKind:'Market brand'}))})}}],usage:{prompt_tokens:1000,completion_tokens:400}})};};
  const handler=searchapiHandler({local:true,analysisKey:'test',analysisBudget:15,store,request});
  const req=Readable.from([JSON.stringify({action:'auditEntities',business})]);req.method='POST';req.headers={origin:'http://127.0.0.1:5174',host:'127.0.0.1:5174','content-type':'application/json'};
  const res={setHeader(){},end(body){this.body=JSON.parse(body);}};await handler(req,res);
  assert.equal(res.body.entityAudit.status,'complete');assert.equal(res.body.entityAudit.reviewed,40);assert.equal(analyses,1);
 }finally{await rm(directory,{recursive:true});}
});
