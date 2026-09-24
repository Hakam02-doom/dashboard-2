import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {searchapiHandler,normalizeAnswer} from '../server/searchapi-handler.mjs';
const business={domain:'upliftai.co',name:'Uplift AI'};
const answer={search_metadata:{status:'Success',id:'test'},markdown:'Uplift AI helps businesses.',reference_links:[{link:'https://upliftai.co/features'},{link:'javascript:alert(1)'},{link:'https://upliftai.co.evil.example/'}],search_queries:['uplift ai'],response_metadata:{is_web_search_performed:true}};
async function call(handler,body={action:'scan',business,prompt:'What is Uplift AI?'},headers={}){const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={origin:'http://127.0.0.1:5174',host:'127.0.0.1:5174','content-type':'application/json',...headers};const res={setHeader(){},end(s){this.body=JSON.parse(s);}};await handler(req,res);return res;}
test('normalizes only evidence and leaves unsupported metrics unassessed',()=>{const row=normalizeAnswer(answer,business,'What is Uplift AI?');assert.equal(row.mentioned,true);assert.equal(row.cited,true);assert.equal(row.position,null);assert.equal(row.comparisonAssessed,false);assert.equal(row.sources.length,2);assert.equal(normalizeAnswer({...answer,reference_links:[{link:'https://upliftai.co.evil.example'}]},business,'x').cited,false);assert.throws(()=>normalizeAnswer({error:'bad'},business,'x'));});
test('rejects production, foreign origins and paid accounts before search',async()=>{let calls=0;const directory=await mkdtemp(join(tmpdir(),'d2-searchapi-'));try{const request=async()=>{calls++;return {ok:true,json:async()=>({subscription:{},account:{remaining_credits:100,monthly_allowance:100}})}};assert.equal((await call(searchapiHandler())).statusCode,503);const h=searchapiHandler({local:true,key:'test',directory,request});assert.equal((await call(h,undefined,{origin:'https://evil.example'})).statusCode,403);assert.equal((await call(h)).statusCode,402);assert.equal(calls,1);}finally{await rm(directory,{recursive:true});}});
test('persists answers by business and enforces durable pilot attempts',async()=>{const directory=await mkdtemp(join(tmpdir(),'d2-searchapi-'));let scans=0;const request=async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer test');assert.ok(!url.includes('api_key'));return {ok:true,json:async()=>url.includes('/me')?{account:{remaining_credits:99,monthly_allowance:0}}:(scans++,answer)}};try{let h=searchapiHandler({local:true,key:'test',directory,request});for(let i=0;i<100;i++)assert.equal((await call(h)).statusCode,200);h=searchapiHandler({local:true,key:'test',directory,request});assert.equal((await call(h)).statusCode,429);assert.equal(scans,100);assert.equal((await call(h,{action:'list',business:{name:'Other',domain:'other.example'}})).body.answers.length,0);assert.equal(JSON.parse(await readFile(join(directory,'searchapi.json'))).attempts,100);}finally{await rm(directory,{recursive:true});}});
test('planned collection reuses saved evidence and never recollects a completed question',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'d2-plan-'));let searches=0,analyses=0;
 const intents=['Discovery','Comparison','Buying decisions','Use cases'];
 const plan={audience:'Small businesses',products:['Marketing software'],questions:Array.from({length:24},(_,i)=>({text:`Which marketing platform supports workflow number ${i+1}?`,intent:intents[Math.floor(i/6)],topic:'Marketing'}))};
 const request=async(url,options)=>({ok:true,json:async()=>{
  if(url.includes('openai.com')){analyses++;const body=JSON.parse(options.body);const input=JSON.parse(body.messages[1].content);const result=input.brands?{brands:input.brands.map(name=>({name,mentioned:name==='Uplift AI',mentionEvidence:name==='Uplift AI'?'Uplift AI helps businesses.':'',sentiment:'Not assessed',sentimentEvidence:'',position:null,positionEvidence:''}))}:plan;return {choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}],usage:{prompt_tokens:10,completion_tokens:10}};}
  if(url.includes('/me'))return {account:{remaining_credits:99,monthly_allowance:0}};
  searches++;return answer;
 }});
 try{const h=searchapiHandler({local:true,key:'test',analysisKey:'analysis',directory,request});assert.equal((await call(h,{action:'plan',business})).statusCode,200);await call(h,{action:'plan',business});assert.equal(analyses,1);const body={action:'collectPrompt',business,promptId:'prompt-1'};const r=await call(h,body);assert.equal(r.statusCode,200);assert.equal(r.body.answers[0].promptId,'prompt-1');await call(h,body);assert.equal(searches,1);assert.equal(analyses,2);const other=await call(h,{...body,engine:'gemini'});assert.equal(other.body.answers.at(-1).engine,'Gemini');assert.equal(searches,2);assert.equal((await call(h,{...body,engine:'unknown'})).statusCode,400);}finally{await rm(directory,{recursive:true});}
});

test('authorized total analysis cap includes earlier attempts and blocks collection before spending',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'d2-budget-'));let calls=0;
 try{
 await writeFile(join(directory,'searchapi.json'),JSON.stringify({attempts:0,analysisAttempts:300,answers:[],plans:{'upliftai.co':{questions:[{id:'prompt-1',text:'Which platform should a small business choose?',topic:'Marketing'}]}}}));
 const h=searchapiHandler({local:true,key:'test',analysisKey:'test',analysisBudget:15,directory,request:async()=>{calls++;throw Error('Must not run');}});
 const list=await call(h,{action:'list',business});assert.equal(list.body.analysisBudget.limit,15);assert.equal(list.body.analysisBudget.reserved,15);
 const r=await call(h,{action:'collectPrompt',business,promptId:'prompt-1'});assert.equal(r.statusCode,429);assert.equal(calls,0);
 }finally{await rm(directory,{recursive:true});}
});

test('tracked prompts reuse today, preserve history and isolate businesses',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'d2-tracked-'));let searches=0;
 const request=async(url,options)=>({ok:true,json:async()=>{
  if(url.includes('openai.com')){const input=JSON.parse(JSON.parse(options.body).messages[1].content);return {choices:[{finish_reason:'stop',message:{content:JSON.stringify({brands:input.brands.map(name=>({name,mentioned:name==='Uplift AI',mentionEvidence:name==='Uplift AI'?'Uplift AI helps businesses.':'',sentiment:'Not assessed',sentimentEvidence:'',position:null,positionEvidence:''}))})}}],usage:{prompt_tokens:10,completion_tokens:10}};}
  if(url.includes('/me'))return {account:{remaining_credits:99,monthly_allowance:0}};
  searches++;return {...answer,search_metadata:{status:'Success',id:`tracked-${searches}`}};
 }});
 try{
 const h=searchapiHandler({local:true,key:'test',analysisKey:'test',directory,request});
 const body={action:'trackPrompt',business,question:{text:'Which marketing tools should I use?',topic:'Marketing',type:'Unbranded'}};
 assert.equal((await call(h,body)).statusCode,200);assert.equal((await call(h,body)).body.answers.length,1);assert.equal(searches,1);
 const file=join(directory,'searchapi.json');const state=JSON.parse(await readFile(file));state.answers[0].answer.at='2026-01-01T00:00:00Z';await writeFile(file,JSON.stringify(state));
 assert.equal((await call(h,body)).body.answers.length,2);assert.equal(searches,2);
 assert.equal((await call(h,{...body,question:{...body.question,text:''}})).statusCode,400);
 assert.equal((await call(h,{action:'list',business:{name:'Other',domain:'other.example'}})).body.answers.length,0);
 }finally{await rm(directory,{recursive:true});}
});

test('planned daily collection preserves history and rejects provider cached answers',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'d2-repeat-'));
 try{
 const file=join(directory,'searchapi.json');
 const prior={...normalizeAnswer(answer,business,'Which tools?'),at:'2026-01-01T00:00:00Z',brandAssessment:{},trackedCompetitors:[]};
 await writeFile(file,JSON.stringify({attempts:1,answers:[{domain:business.domain,promptId:'p1',collectionEngine:'chatgpt',answer:prior}],plans:{'upliftai.co':{questions:[{id:'p1',text:'Which tools?',topic:'Tools'}]}}}));
 const request=async(url)=>({ok:true,json:async()=>url.includes('/me')?{account:{remaining_credits:50,monthly_allowance:0}}:answer});
 const h=searchapiHandler({local:true,key:'test',analysisKey:'test',directory,request});
 const r=await call(h,{action:'collectPrompt',business,promptId:'p1'});assert.equal(r.statusCode,502);assert.match(r.body.error,/cached/);assert.equal(JSON.parse(await readFile(file)).answers.length,1);
 }finally{await rm(directory,{recursive:true});}
});
test('identity review saves without provider calls and retains historical tracked brands',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'d2-review-'));
 try{
 const file=join(directory,'searchapi.json');await writeFile(file,JSON.stringify({attempts:0,answers:[{domain:business.domain,answer:{...normalizeAnswer(answer,business,'Which tools?'),brandAssessment:{},trackedCompetitors:['Old brand']}}]}));
 const h=searchapiHandler({local:true,directory,request:()=>{throw Error('No provider calls expected');}});
 const r=await call(h,{action:'measurementProfile',business,profile:{reviewed:true,aliases:{'Uplift AI':['UpliftAI']}}});assert.equal(r.statusCode,200);assert.deepEqual(r.body.measurementProfile.aliases['Uplift AI'],['UpliftAI']);assert.equal(r.body.pendingIdentityCount,1);assert.equal(r.body.answers.length,0);assert.deepEqual(JSON.parse(await readFile(file)).answers[0].answer.trackedCompetitors,['Old brand']);
 }finally{await rm(directory,{recursive:true});}
});
test('regional brand identity repairs saved answers without another search credit',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'d2-regional-repair-'));
 const adidas={name:'adidas IN',domain:'adidas.co.in'};
 const text='Adidas and Nike make running shoes. Choose shoes based on fit.';
 let analyses=0,searches=0;
 try{
  await writeFile(join(directory,'searchapi.json'),JSON.stringify({attempts:1,answers:[{domain:adidas.domain,answer:{id:'old-adidas',at:new Date().toISOString(),engine:'ChatGPT Search',prompt:'Which running shoes should I buy?',answer:text,sources:['https://example.org/shoes'],mentioned:false,competitors:['Nike','On'],trackedCompetitors:['Nike','On'],brandAssessment:{'adidas IN':{},Nike:{},On:{}},measurementVersion:2}}],competitors:{[adidas.domain]:['Nike','On']}}));
  const request=async(url,options)=>{if(!url.includes('openai.com')){searches++;throw Error('Search collection must not run during repair');}analyses++;const input=JSON.parse(JSON.parse(options.body).messages[1].content);assert.deepEqual(input.aliases['adidas IN'],['adidas']);return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({brands:input.brands.map(name=>({name,mentioned:name!=='On',recommended:null,recommendationEvidence:'',mentionEvidence:name==='adidas IN'?'Adidas and Nike make running shoes.':name==='Nike'?'Adidas and Nike make running shoes.':'',sentiment:'Not assessed',sentimentEvidence:'',position:null,positionEvidence:''}))})}}],usage:{prompt_tokens:50,completion_tokens:40}})};};
  const h=searchapiHandler({local:true,directory,analysisKey:'test',request});
  const before=await call(h,{action:'list',business:adidas});assert.equal(before.body.pendingIdentityCount,1);assert.equal(before.body.answers.length,0);
  const after=await call(h,{action:'reassessIdentity',business:adidas});assert.equal(after.statusCode,200);assert.equal(after.body.pendingIdentityCount,0);assert.equal(after.body.answers[0].mentioned,true);assert.deepEqual(after.body.answers[0].competitors,['Nike']);assert.equal(after.body.answers[0].sources[0],'https://example.org/shoes');assert.equal(analyses,1);assert.equal(searches,0);
 }finally{await rm(directory,{recursive:true});}
});
