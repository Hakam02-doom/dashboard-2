import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {journaledRequest,createJobsWorker,publicJob} from '../server/analysis-jobs.mjs';
import {followAnalysisJob} from '../src/analysis-jobs-client.mjs';
import {searchapiHandler} from '../server/searchapi-handler.mjs';
function journalClient(){const rows=new Map();return {rows,from:()=>({insert:async row=>{if(rows.has(row.fingerprint))return {error:{code:'23505'}};rows.set(row.fingerprint,row);return {};},select:()=>({eq:()=>({eq:(_k,key)=>({single:async()=>({data:rows.get(key)})})})}),update:value=>({eq:()=>({eq:async(_k,key)=>{Object.assign(rows.get(key),value);return {};}})})})};}
test('completed provider responses survive worker restarts without another paid call',async()=>{
 const client=journalClient();let calls=0;const fetcher=async()=>{calls++;return new Response(JSON.stringify({answer:'evidence'}));};
 const options={method:'POST',body:'same request'};
 assert.equal((await (await journaledRequest(client,'job',fetcher)('https://api.openai.com/v1/chat/completions',options)).json()).answer,'evidence');
 assert.equal((await (await journaledRequest(client,'job',fetcher)('https://api.openai.com/v1/chat/completions',options)).json()).answer,'evidence');assert.equal(calls,1);
});
test('ambiguous in-flight provider requests are never charged again automatically',async()=>{
 const client=journalClient();let calls=0;const fetcher=async()=>{calls++;throw Error('connection lost');};
 const request=journaledRequest(client,'job',fetcher);
 await assert.rejects(request('https://api.openai.com/v1/chat/completions'),/connection lost/);
 await assert.rejects(request('https://api.openai.com/v1/chat/completions'),/not be charged again/);assert.equal(calls,1);
});
test('browser reconnects to durable progress and never starts duplicate work',async()=>{
 let calls=0;const stages=[];
 const result=await followAnalysisJob('job',{request:async body=>{assert.equal(body.action,'status');assert.equal(body.id,'job');return {job:{id:'job',status:++calls===3?'complete':'running',progress:calls*30}};},sleep:async()=>{},onJob:j=>stages.push(j.progress)});
 assert.equal(result.status,'complete');assert.deepEqual(stages,[30,60,90]);
});
test('temporary polling failure reconnects; terminal failures stop polling',async()=>{
 let calls=0;assert.equal((await followAnalysisJob('job',{request:async()=>{if(++calls<3)throw Error('network');return {job:{status:'complete'}};},sleep:async()=>{}})).status,'complete');
 await assert.rejects(followAnalysisJob('job',{request:async()=>({job:{status:'failed',error:'Quota reached'}})}),/Quota reached/);
});
test('public status never reveals ownership, network hashes or worker credentials',()=>{
 const result=publicJob({id:'id',owner_id:'secret',visitor_hash:'secret',lease:'secret',profile:{name:'Brand'},status:'queued'});
 assert.equal(result.owner_id,undefined);assert.equal(result.visitor_hash,undefined);assert.equal(result.lease,undefined);
});
test('worker rejects unauthorized requests before touching the queue',async()=>{
 const worker=createJobsWorker({AI_CRON_SECRET:'a'.repeat(40)},{client:{rpc:()=>{throw Error('must not run');}}});
 const res={setHeader(){},end(raw){this.body=JSON.parse(raw);}};await worker({headers:{}},res);assert.equal(res.statusCode,401);
});
test('worker saves resumable progress then wakes the next worker',async()=>{
 const calls=[];const client={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='ai_analysis_claim'?{id:'job',lease:'lease',progress:20}:true};}};
 const worker=createJobsWorker({AI_CRON_SECRET:'a'.repeat(40)},{client,step:async()=>({status:'queued',stage:'Question 1',progress:40})});
 const res={setHeader(){},end(raw){this.body=JSON.parse(raw);}};await worker({headers:{authorization:'Bearer '+'a'.repeat(40)}},res);
 assert.equal(res.body.status,'queued');assert.deepEqual(calls.map(c=>c.name),['ai_analysis_claim','ai_analysis_finish','ai_analysis_wake']);assert.equal(calls[1].args.lock_id,'lease');
});
test('baseline worker completes across separate invocations with at most one paid call per step',async()=>{
 let state={attempts:0,answers:[]},paid=0,answerId=0;
 const store={kind:'test',load:async()=>structuredClone(state),save:async next=>{state=structuredClone(next);},acquire:async()=>'lease',release:async()=>{}};
 const request=async(url,options)=>{
  if(url.endsWith('/me'))return new Response(JSON.stringify({account:{remaining_credits:100,monthly_allowance:0}}));
  paid++;
  if(url.includes('searchapi'))return new Response(JSON.stringify({search_metadata:{status:'Success',id:'a'+ ++answerId},markdown:'Acme and Rival are recommended business tools.',reference_links:[{link:'https://rival.com'}]}));
  const body=JSON.parse(options.body),input=JSON.parse(body.messages[1].content);
  const result=input.research?{category:'Business tools',competitors:[{name:'Rival',domain:'rival.com',evidence:'Rival'}],questions:['Which tools help teams?','What tools suit small teams?','How should teams choose software?']}:{brands:input.brands.map(name=>({name,mentioned:true,recommended:true,recommendationEvidence:'Acme and Rival are recommended business tools.',sentiment:'Positive',sentimentEvidence:'Acme and Rival are recommended business tools.',position:null,positionEvidence:'',mentionEvidence:name})),discoveredBrands:[]};
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}],usage:{prompt_tokens:100,completion_tokens:100}}));
 };
 let response;
 for(let i=0;i<8;i++){
  const before=paid,handler=searchapiHandler({local:true,key:'test',analysisKey:'test',analysisBudget:15,store,request});
  const req=Readable.from([JSON.stringify({action:'baselineStep',business:{name:'Acme',domain:'acme.com'}})]);req.method='POST';req.internalWorker=true;req.headers={origin:'http://127.0.0.1:5174',host:'127.0.0.1:5174','content-type':'application/json'};
  response={setHeader(){},end(raw){this.body=JSON.parse(raw);}};await handler(req,response);
  assert.equal(response.statusCode,200);assert.equal(paid-before,1);assert.notEqual(response.body.report.status,'partial',response.body.report.error);
 }
 assert.equal(response.body.report.status,'complete');assert.equal(response.body.answers.length,3);assert.equal(paid,8);
});
