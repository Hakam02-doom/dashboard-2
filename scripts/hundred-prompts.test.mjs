import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {nextPromptBatch,appendPromptBatch,BUYER_INTENTS} from '../server/hundred-prompts.mjs';
import {searchapiHandler} from '../server/searchapi-handler.mjs';
const makeBatch=(intent,count,offset=0)=>({questions:Array.from({length:count},(_,i)=>({text:`Which running shoes fit ${intent} buyer scenario number ${i+offset}?`,intent,topic:'Running shoes'}))});
test('40-question plan balances four intents and rejects branded and duplicate questions',()=>{
 let plan={questions:[]};for(const intent of BUYER_INTENTS){const batch=nextPromptBatch(plan.questions);assert.deepEqual(batch,{intent,count:10});plan=appendPromptBatch(plan,makeBatch(intent,10),batch,['Nike']);}
 assert.equal(plan.questions.length,40);assert.equal(nextPromptBatch(plan.questions),null);assert.equal(new Set(plan.questions.map(q=>q.id)).size,40);
 assert.throws(()=>appendPromptBatch({questions:[]},makeBatch('Discovery',9),{intent:'Discovery',count:10}),/incomplete/);
 const branded=makeBatch('Discovery',10);branded.questions[0].text='Which Nike running shoes are best for beginners?';assert.throws(()=>appendPromptBatch(null,branded,{intent:'Discovery',count:10},['Nike']),/branded/);
 const duplicate=makeBatch('Discovery',10);duplicate.questions[9]=duplicate.questions[0];assert.throws(()=>appendPromptBatch(null,duplicate,{intent:'Discovery',count:10}),/repeated/);
});
test('40-question durable run splits calls, survives restarts, and produces 40 assessed answers once',async()=>{
 let state={answers:[],attempts:0,analysisAttempts:528},paid=0,searches=0,assessments=0,plans=0,writing=0;
 const store={kind:'test',acquire:async()=>true,release:async()=>{},load:async()=>structuredClone(state),save:async s=>{assert.equal(++writing,1);await new Promise(r=>setTimeout(r,1));state=structuredClone(s);writing--;}};
 const request=async(url,options)=>{paid++;const body=JSON.parse(options.body);let data;
  if(url.endsWith('/responses')){searches++;assert.equal(body.max_tool_calls,2);data={id:`answer-${searches}`,status:'completed',output:[{type:'web_search_call',action:{type:'search'}},{type:'message',content:[{type:'output_text',text:'Acme makes running shoes.',annotations:[{url:'https://acme.com/shoes'}]}]}]};}
  else {const input=JSON.parse(body.messages[1].content);let result;
   if(input.brands){assessments++;result={brands:[{name:'Acme',mentioned:true,mentionEvidence:'Acme makes running shoes.',recommended:false,recommendationEvidence:'',sentiment:'Neutral',sentimentEvidence:'Acme makes running shoes.',position:null,positionEvidence:''}],discoveredBrands:[]};}
   else{const intent=BUYER_INTENTS.find(value=>body.messages[0].content.includes('intent \"'+value+'\"'));plans++;result=makeBatch(intent,plans===2?9:10);}
   data={choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]};
  }return {ok:true,json:async()=>data};
 };
 const call=async(internal=true)=>{const handler=searchapiHandler({local:true,analysisKey:'fake',analysisBudget:31,store,request});const req=Readable.from([JSON.stringify({action:'benchmarkStep',business:{name:'Acme',domain:'acme.com',description:'Running shoes'}})]);req.method='POST';req.internalWorker=internal;req.headers={origin:'http://127.0.0.1:5174',host:'127.0.0.1:5174','content-type':'application/json'};const res={setHeader(){},end(raw){this.body=JSON.parse(raw);}};await handler(req,res);return res;};
 assert.equal((await call(false)).statusCode,403);
 for(let i=0;i<4;i++){const before=paid;const r=await call();assert.equal(r.statusCode,200,JSON.stringify(r.body));assert.equal(paid-before,i===0?4:i===1?1:i===3?32:48);assert.notEqual(r.body.benchmark?.status,'partial');}
 const done=await call();assert.equal(paid,85);assert.equal(plans,5);assert.equal(searches,40);assert.equal(assessments,40);assert.equal(done.body.answers.length,40);assert.equal(done.body.benchmark.completed.length,40);assert.equal(done.body.benchmark.status,'complete');assert.equal(done.body.analysisBudget.limit,31);assert.equal(state.analysisAttempts,613);
 assert.deepEqual(state.answers.slice(0,4).map(row=>state.plans['acme.com'].questions.find(q=>q.id===row.promptId).intent),BUYER_INTENTS);
 await call();assert.equal(paid,85);
});
test('legacy plans retain their identifiers when expanded to 40 questions',()=>{
 let plan={questions:BUYER_INTENTS.flatMap((intent,n)=>makeBatch(intent,6).questions.map((q,i)=>({...q,id:`prompt-${n*6+i+1}`})))};
 const original=structuredClone(plan.questions);
 for(const intent of BUYER_INTENTS){const batch=nextPromptBatch(plan.questions);assert.equal(batch.count,4);plan=appendPromptBatch(plan,makeBatch(intent,4,6),batch);}
 assert.deepEqual(plan.questions.slice(0,24),original);assert.equal(plan.questions.length,40);
});
test('the shared $31 ceiling stops new paid requests even if configured higher',async()=>{
 let network=0;const state={answers:[],analysisAttempts:620,attempts:0};const store={kind:'test',load:async()=>state,save:async()=>{},acquire:async()=>true,release:async()=>{}};
 const handler=searchapiHandler({local:true,analysisKey:'fake',analysisBudget:500,store,request:async()=>{network++;throw Error('Unexpected spend');}});
 const req=Readable.from([JSON.stringify({action:'benchmarkStep',business:{name:'Acme',domain:'acme.com'}})]);req.method='POST';req.internalWorker=true;req.headers={origin:'http://127.0.0.1:5174',host:'127.0.0.1:5174','content-type':'application/json'};const res={setHeader(){},end(raw){this.body=JSON.parse(raw);}};await handler(req,res);assert.equal(res.statusCode,429);assert.match(res.body.error,/budget reached/);assert.equal(network,0);
});
test('an extra valid generated question is trimmed without spending on regeneration',()=>{
 const plan=appendPromptBatch(null,makeBatch('Use cases',11),{intent:'Use cases',count:10});assert.equal(plan.questions.length,10);
});
