import test from 'node:test';
import assert from 'node:assert/strict';
import {authFailure,emailLinkFailure,retrySeconds,withAuthTimeout} from '../src/ai-auth-feedback.js';
test('rate-limit feedback never claims another email was sent',()=>{for(const e of [{status:429},{message:'email rate limit exceeded'}]){assert.match(authFailure(e),/No new email was sent/);assert.match(authFailure(e),/most recent link/);}});
test('slow monitoring connection gives a retryable message without losing results',()=>{assert.match(authFailure({name:'TimeoutError',message:'The operation was aborted due to timeout'}),/saved results are still there/);});
test('resend cooldown expires using elapsed wall time',()=>{assert.equal(retrySeconds(61000,1000),60);assert.equal(retrySeconds(61000,60500),1);assert.equal(retrySeconds(61000,62000),0);});
test('gateway failures do not say the account or email link is invalid',()=>{assert.match(authFailure({status:504,message:'HTTP 504'}),/temporarily unavailable/);assert.match(emailLinkFailure({status:504}),/Check your inbox/);});
test('slow email requests stop the sending state',async()=>{await assert.rejects(withAuthTimeout(new Promise(()=>{}),5),{name:'TimeoutError'});});
