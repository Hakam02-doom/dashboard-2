import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureGuestSession} from '../src/guest-session.mjs';
import {generateWebsiteInsights} from '../src/website-insights-flow.mjs';

test('existing workspace identity and history survive the removal of login',async()=>{
 const user={id:'existing-owner'};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),signInAnonymously:()=>{throw Error('must not replace an existing session');}}};
 assert.equal(await ensureGuestSession(client),user);
});
test('simultaneous mounts create only one private guest session',async()=>{
 let creations=0;const user={id:'guest',is_anonymous:true};
 const client={auth:{getSession:async()=>({data:{session:null}}),signInAnonymously:async()=>{creations++;return {data:{session:{user}}};}}};
 const users=await Promise.all([ensureGuestSession(client),ensureGuestSession(client)]);
 assert.equal(creations,1);assert.deepEqual(users,[user,user]);
});
test('guest failure remains an error and can be retried',async()=>{
 let fail=true;const client={auth:{getSession:async()=>({data:{session:null}}),signInAnonymously:async()=>fail?{error:Error('unavailable')}:{data:{session:{user:{id:'guest'}}}}}};
 await assert.rejects(ensureGuestSession(client),/unavailable/);fail=false;
 assert.equal((await ensureGuestSession(client)).id,'guest');
});
test('a saved report opens without spending another collection request',async()=>{
 const calls=[];const saved={answers:[{id:'answer-1'}]};
 const result=await generateWebsiteInsights({domain:'example.com'},{collect:async action=>{calls.push(action);return saved;}});
 assert.equal(result,saved);assert.deepEqual(calls,['list']);
});
test('website analysis automatically collects missing results',async()=>{
 const calls=[];
 const result=await generateWebsiteInsights({domain:'example.com'},{collect:async action=>{calls.push(action);return {answers:action==='baseline'?[{id:'real-answer'}]:[]};}});
 assert.equal(result.answers.length,1);assert.deepEqual(calls,['list','baseline']);
});
test('failed collection never opens an empty dashboard as a successful report',async()=>{
 await assert.rejects(generateWebsiteInsights({domain:'example.com'},{collect:async action=>({answers:[],report:action==='baseline'?{error:'Provider quota reached.'}:null})}),/Provider quota reached/);
});

test('lock contention waits automatically, then accepts the original result',async()=>{
 const {analysisRequest}=await import('../src/analysis-request.mjs');
 let calls=0;const waits=[],stages=[];
 const result=await analysisRequest(async()=>++calls<3?{ok:false,status:429,json:async()=>({code:'ANALYSIS_BUSY',retryAfter:5})}:{ok:true,json:async()=>({answers:[{id:'saved'}]})},{sleep:async ms=>waits.push(ms),onWaiting:text=>stages.push(text)});
 assert.equal(result.answers[0].id,'saved');assert.equal(calls,3);assert.deepEqual(waits,[5000,5000]);assert.equal(stages.length,2);
});
test('quota failures and uncertain provider timeouts are never automatically replayed',async()=>{
 const {analysisRequest}=await import('../src/analysis-request.mjs');
 for(const fail of [()=>Promise.resolve({ok:false,status:429,json:async()=>({error:'OpenAI pilot budget reached.'})}),()=>Promise.reject(Error('Provider timeout'))]){
  let calls=0;await assert.rejects(analysisRequest(()=>{calls++;return fail();},{sleep:()=>{throw Error('must not retry');}}));assert.equal(calls,1);
 }
});
test('persistent lock contention has a bounded wait without showing manual profile entry',async()=>{
 const {analysisRequest}=await import('../src/analysis-request.mjs');
 let calls=0;await assert.rejects(analysisRequest(async()=>{calls++;return {ok:false,status:429,json:async()=>({code:'ANALYSIS_BUSY'})};},{sleep:async()=>{},maxWaits:2}),/still finishing/);assert.equal(calls,3);
});
