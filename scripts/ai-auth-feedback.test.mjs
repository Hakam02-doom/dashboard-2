import test from 'node:test';
import assert from 'node:assert/strict';
import {authFailure,retrySeconds} from '../src/ai-auth-feedback.js';
test('rate-limit feedback never claims another email was sent',()=>{for(const e of [{status:429},{message:'email rate limit exceeded'}]){assert.match(authFailure(e),/No new email was sent/);assert.match(authFailure(e),/most recent link/);}});
test('slow monitoring connection gives a retryable message without losing results',()=>{assert.match(authFailure({name:'TimeoutError',message:'The operation was aborted due to timeout'}),/saved results are still there/);});
test('resend cooldown expires using elapsed wall time',()=>{assert.equal(retrySeconds(61000,1000),60);assert.equal(retrySeconds(61000,60500),1);assert.equal(retrySeconds(61000,62000),0);});
