import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedUser} from '../server/cloud-runtime.mjs';

const request={headers:{authorization:'Bearer session-token'}};
test('valid sessions remain usable',async()=>{const user={id:'account-1'};assert.deepEqual(await verifiedUser(request,{auth:{getUser:async()=>({data:{user},error:null})}}),user);});
test('a gateway failure does not invalidate a confirmed session',async()=>{await assert.rejects(verifiedUser(request,{auth:{getUser:async()=>({data:{user:null},error:{status:504}})}}),error=>error.status===503&&/temporarily unavailable/.test(error.message));});
test('a network failure does not invalidate a confirmed session',async()=>{await assert.rejects(verifiedUser(request,{auth:{getUser:async()=>({data:{user:null},error:{name:'AuthRetryableFetchError',status:0,message:'fetch failed'}})}}),error=>error.status===503);});
test('an invalid session still needs a new sign-in',async()=>{await assert.rejects(verifiedUser(request,{auth:{getUser:async()=>({data:{user:null},error:{status:401}})}}),/session expired/);});
