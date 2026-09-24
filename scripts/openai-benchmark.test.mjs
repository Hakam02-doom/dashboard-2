import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {normalizeOpenAIWebResponse} from '../server/openai-web-collector.mjs';
import {canonicalWebsiteName,assessmentAliases} from '../server/brand-identity.mjs';
import {applyAssessment,assessmentNamesForAnswer,asksForOptions,completeBenchmarkPlan,extendBenchmarkPlan} from '../server/ai-analysis.mjs';
import {reportMetrics} from '../src/ai-insights-data.js';
import {searchapiHandler} from '../server/searchapi-handler.mjs';

const adidas={name:'adidas IN',domain:'adidas.co.in',description:'Athletic shoes and apparel'};
const web={id:'web-1',status:'completed',usage:{input_tokens:8100,output_tokens:350},output:[{type:'web_search_call',action:{type:'search',queries:['running shoes India']}},{type:'message',content:[{type:'output_text',text:'Adidas and Nike offer running shoes. On also makes running shoes.',annotations:[{type:'url_citation',url:'https://example.org/running-shoes'},{type:'url_citation',url:'javascript:alert(1)'}]}]}]};

test('web answer requires a completed search and retains only safe citations',()=>{
 const result=normalizeOpenAIWebResponse(web,adidas,'Which running shoes are good?');
 assert.equal(result.answer.engine,'OpenAI Web Search');
 assert.equal(result.answer.assessmentPending,true);
 assert.deepEqual(result.answer.sources,['https://example.org/running-shoes']);
 assert.deepEqual(result.answer.fanout,['running shoes India']);
 assert.ok(result.cost>0.01&&result.cost<0.05);
 assert.throws(()=>normalizeOpenAIWebResponse({...web,output:web.output.slice(1)},adidas,'x'),/web-grounded/);
});

test('regional and legal website names map to the public brand without stripping product names',()=>{
 for(const [name,domain,expected] of [['adidas IN','adidas.co.in','adidas'],['Searchable Limited','searchable.com','Searchable'],['New Balance US','newbalance.com','New Balance'],['Shopify Inc.','shopify.com','Shopify'],['WeDone AI','wedone.ai','WeDone AI']]){
  assert.equal(canonicalWebsiteName(name,domain),expected);
  if(expected!==name)assert.deepEqual(assessmentAliases({name,domain})[name],[expected]);
 }
});

test('answer-discovered brands have one shared denominator and unsupported names are rejected',()=>{
 const base={at:'2026-09-24T12:00:00Z',prompt:'Which running shoes are good?',engine:'OpenAI Web Search',answer:'Adidas and Nike offer running shoes. Nike Pegasus 41 is a model. On also makes running shoes.'};
 const checked=applyAssessment(base,{brands:[{name:'adidas IN',mentioned:true,mentionEvidence:'Adidas and Nike offer running shoes.',recommended:null,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:'Adidas and Nike offer running shoes.',position:null,positionEvidence:''}],discoveredBrands:[{name:'Nike',entityKind:'Market brand',mentioned:true,mentionEvidence:'Adidas and Nike offer running shoes.',recommended:null,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:'Adidas and Nike offer running shoes.',position:null,positionEvidence:''},{name:'NIKE',entityKind:'Market brand',mentioned:true,mentionEvidence:'Adidas and Nike offer running shoes.',recommended:null,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:'Adidas and Nike offer running shoes.',position:null,positionEvidence:''},{name:'Nike Pegasus 41',entityKind:'Product or model',mentioned:true,mentionEvidence:'Nike Pegasus 41 is a model.',recommended:null,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:'Nike Pegasus 41 is a model.',position:null,positionEvidence:''},{name:'On',entityKind:'Market brand',mentioned:true,mentionEvidence:'On also makes running shoes.',recommended:null,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:'On also makes running shoes.',position:null,positionEvidence:''},{name:'Puma',entityKind:'Market brand',mentioned:true,mentionEvidence:'Puma makes running shoes.',recommended:null,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:'',position:null,positionEvidence:''}]},['adidas IN'],'adidas IN',{'adidas IN':['adidas']});
 assert.equal(checked.mentioned,true);
 assert.deepEqual(checked.competitors,['Nike','On']);
 assert.ok(!checked.trackedCompetitors.includes('Nike Pegasus 41'));
 assert.equal(checked.discoveryComplete,true);
 const second={...checked,at:'2026-09-25T12:00:00Z',prompt:'What is shoe fit?',answer:'Good fit matters.',mentioned:false,competitors:[],trackedCompetitors:[],brandAssessment:{},competitorMetrics:{}};
 const ranks=reportMetrics([checked,second],'adidas IN');
 assert.equal(ranks.find(b=>b.name==='Nike').visibility,50);
 assert.equal(ranks.find(b=>b.name==='Nike').sampleSize,2);
 assert.equal(ranks.find(b=>b.name==='Puma'),undefined);
});

test('verified regional mention saves an actual answer excerpt when model omits the quote',()=>{
 const row={answer:'For beginners, Adidas makes the Duramo and Nike makes the Revolution.',prompt:'Which running shoes suit beginners?',engine:'OpenAI Web Search'};
 const item={name:'adidas IN',mentioned:false,mentionEvidence:'',recommended:null,recommendationEvidence:'',sentiment:'Not assessed',sentimentEvidence:'',position:null,positionEvidence:''};
 const checked=applyAssessment(row,{brands:[item],discoveredBrands:[]},['adidas IN'],'adidas IN',{'adidas IN':['Adidas']});
 assert.equal(checked.mentioned,true);
 assert.match(checked.brandAssessment['adidas IN'].mentionEvidence,/Adidas makes the Duramo/);
 assert.ok(row.answer.includes(checked.brandAssessment['adidas IN'].mentionEvidence));
});

test('benchmark classifies only named competitors and accepts a verified regional alias',()=>{
 const answer='Adidas and Nike are common running shoe brands.';
 const aliases={'adidas IN':['Adidas']};
 assert.deepEqual(assessmentNamesForAnswer('adidas IN',['Nike','Puma','On'],answer,aliases),['adidas IN','Nike']);
 const item={name:'Adidas',mentioned:true,mentionEvidence:'Adidas and Nike are common running shoe brands.',recommended:null,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:'Adidas and Nike are common running shoe brands.',position:null,positionEvidence:''};
 const checked=applyAssessment({answer,prompt:'Which running shoe brands?',engine:'OpenAI Web Search'},{brands:[item],discoveredBrands:[]},['adidas IN'],'adidas IN',aliases);
 assert.equal(checked.mentioned,true);
 assert.ok(Object.hasOwn(checked.brandAssessment,'adidas IN'));
});

test('branded or repeated generated questions are replaced with distinct category questions',()=>{
 const draft={audience:'Marketing teams',products:['AI visibility software'],questions:Array.from({length:24},(_,i)=>({text:i<12?'Which Searchable products should I buy?':`Which AI visibility tools fit team scenario ${i}?`,intent:['Discovery','Comparison','Buying decisions','Use cases'][Math.floor(i/6)],topic:'AI visibility software'}))};
 const plan=completeBenchmarkPlan(draft,['Searchable Limited','Searchable','Peec AI'],'AI visibility tools');
 assert.equal(plan.questions.length,24);
 assert.equal(new Set(plan.questions.map(q=>q.text)).size,24);
 assert.ok(plan.questions.every(q=>!q.text.toLowerCase().includes('searchable')));
 assert.deepEqual(['Discovery','Comparison','Buying decisions','Use cases'].map(intent=>plan.questions.filter(q=>q.intent===intent).length),[6,6,6,6]);
});

test('future plans replace advice prompts with questions that ask for market options',()=>{
 assert.equal(asksForOptions('How can a clinic use AI SEO software to make content?'),false);
 assert.equal(asksForOptions('Which AI SEO platforms suit a clinic?'),true);
 const intents=['Discovery','Comparison','Buying decisions','Use cases'];
 const draft={audience:'Clinics',products:['Uplift AI'],questions:Array.from({length:24},(_,i)=>({text:`How can a clinic use AI SEO software for scenario number ${i+1}?`,intent:intents[Math.floor(i/6)],topic:'AI SEO'}))};
 const plan=completeBenchmarkPlan(draft,['Uplift AI'],'AI SEO automation platform for local businesses');
 assert.equal(plan.questions.length,24);
 assert.ok(plan.questions.every(q=>asksForOptions(q.text)));
 assert.ok(plan.questions.every(q=>!q.text.includes('for local businesses')));
});

test('extended question plan adds two distinct scenarios per buyer intent',()=>{
 const intents=['Discovery','Comparison','Buying decisions','Use cases'];
 const plan={questions:Array.from({length:24},(_,i)=>({id:`prompt-${i+1}`,text:`Which running shoe options suit buyer situation number ${i+1}?`,intent:intents[Math.floor(i/6)],topic:'Running shoes'}))};
 const extension={questions:Array.from({length:8},(_,i)=>({text:`Which running shoe options fit extended scenario number ${i+1}?`,intent:intents[Math.floor(i/2)],topic:'Running shoes'}))};
 const result=extendBenchmarkPlan(plan,extension,['adidas IN','Nike']);
 assert.equal(result.questions.length,32);
 assert.deepEqual(intents.map(intent=>result.questions.filter(q=>q.intent===intent).length),[8,8,8,8]);
 assert.throws(()=>extendBenchmarkPlan(plan,{questions:[...extension.questions.slice(0,7),plan.questions[0]]},['adidas IN']),/repeated|two questions/);
});

test('20-question benchmark saves each answer, discovers brands and resumes without recollecting',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'d2-benchmark-'));
 let searches=0,assessments=0,plans=0;
 const intents=['Discovery','Comparison','Buying decisions','Use cases'];
 const plan={audience:'Runners',products:['Running shoes'],questions:Array.from({length:24},(_,i)=>({text:`Which running shoe options suit buyer situation number ${i+1}?`,intent:intents[Math.floor(i/6)],topic:'Running shoes'}))};
 const extension={questions:Array.from({length:8},(_,i)=>({text:`Which running shoe options fit extended scenario number ${i+1}?`,intent:intents[Math.floor(i/2)],topic:'Running shoes'}))};
 const request=async(url,options)=>({ok:true,json:async()=>{
  if(url.endsWith('/responses')){searches++;return {...web,id:`web-${searches}`};}
  if(url.includes('chat/completions')){const input=JSON.parse(JSON.parse(options.body).messages[1].content);if(!input.brands){plans++;return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(input.priorQuestions?extension:plan)}}]};}assessments++;return {choices:[{finish_reason:'stop',message:{content:JSON.stringify({brands:input.brands.map(name=>({name,mentioned:name==='adidas IN',mentionEvidence:name==='adidas IN'?'Adidas and Nike offer running shoes.':'',recommended:null,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:name==='adidas IN'?'Adidas and Nike offer running shoes.':'',position:null,positionEvidence:''})),discoveredBrands:[{name:'Nike',entityKind:'Market brand',mentioned:true,mentionEvidence:'Adidas and Nike offer running shoes.',recommended:null,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:'Adidas and Nike offer running shoes.',position:null,positionEvidence:''}]})}}]};}
  throw Error('Unexpected provider');
 }});
 const call=async(handler,action='benchmarkNext')=>{const req=Readable.from([JSON.stringify({action,business:adidas})]);req.method='POST';req.headers={origin:'http://127.0.0.1:5174',host:'127.0.0.1:5174','content-type':'application/json'};const res={setHeader(){},end(x){this.body=JSON.parse(x);}};await handler(req,res);return res;};
 try{
  let h=searchapiHandler({local:true,analysisKey:'test',analysisBudget:15,directory,request});
  for(let i=0;i<20;i++){const r=await call(h);assert.equal(r.statusCode,200);assert.equal(r.body.benchmark.completed.length,i+1);}
  const done=await call(h);assert.equal(done.body.benchmark.status,'complete');assert.equal(done.body.answers.length,20);
  assert.ok(done.body.answers.every(answer=>answer.benchmarkId===done.body.benchmark.startedAt));
  assert.equal(searches,20);assert.equal(assessments,20);assert.equal(plans,1);
  h=searchapiHandler({local:true,analysisKey:'test',analysisBudget:15,directory,request});await call(h);assert.equal(searches,20);
  const expanded=await call(h,'benchmarkExpand');assert.equal(expanded.statusCode,200,JSON.stringify(expanded.body));assert.equal(expanded.body.benchmark.total,32);
  for(let i=0;i<12;i++){const r=await call(h);assert.equal(r.statusCode,200);assert.equal(r.body.benchmark.completed.length,21+i);}
  const full=await call(h);assert.equal(full.body.benchmark.status,'complete');assert.equal(full.body.answers.length,32);
  assert.equal(searches,32);assert.equal(assessments,32);assert.equal(plans,2);
  const ranks=reportMetrics(done.body.answers,'adidas IN');assert.equal(ranks.find(b=>b.name==='Nike').visibility,100);
 }finally{await rm(directory,{recursive:true});}
});
