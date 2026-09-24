import test from 'node:test';
import assert from 'node:assert/strict';
import {claimWorkspace,verifiedUser} from '../server/cloud-runtime.mjs';

const request={headers:{authorization:'Bearer session-token'}};
test('valid sessions remain usable',async()=>{const user={id:'account-1'};assert.deepEqual(await verifiedUser(request,{auth:{getUser:async()=>({data:{user},error:null})}}),user);});
test('a gateway failure does not invalidate a confirmed session',async()=>{await assert.rejects(verifiedUser(request,{auth:{getUser:async()=>({data:{user:null},error:{status:504}})}}),error=>error.status===503&&/temporarily unavailable/.test(error.message));});
test('a network failure does not invalidate a confirmed session',async()=>{await assert.rejects(verifiedUser(request,{auth:{getUser:async()=>({data:{user:null},error:{name:'AuthRetryableFetchError',status:0,message:'fetch failed'}})}}),error=>error.status===503);});
test('an invalid session still needs a new sign-in',async()=>{await assert.rejects(verifiedUser(request,{auth:{getUser:async()=>({data:{user:null},error:{status:401}})}}),/session expired/);});
test('workspace claim retries a transient gateway error without changing the account',async()=>{
 const calls=[];
 const client={rpc(name,args){calls.push([name,args]);return {abortSignal:async()=>calls.length===1?{data:null,error:{status:504,message:'Gateway timeout'}}:{data:true,error:null}};}};
 const result=await claimWorkspace(client,'account-1');
 assert.equal(result.data,true);
 assert.deepEqual(calls,[['ai_workspace_claim',{account_id:'account-1'}],['ai_workspace_claim',{account_id:'account-1'}]]);
});
test('workspace claim does not retry a permission failure',async()=>{
 let calls=0;const client={rpc(){calls++;return {abortSignal:async()=>({data:null,error:{status:403,message:'Forbidden'}})};}};
 assert.equal((await claimWorkspace(client,'account-1')).error.status,403);
 assert.equal(calls,1);
});
