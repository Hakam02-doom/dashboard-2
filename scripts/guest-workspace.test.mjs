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
