import test from 'node:test';
import assert from 'node:assert/strict';
import {rollbackOnboarding} from '../server/rollback-onboarding.mjs';
test('retire setup selections but preserve answers and unrelated business state',()=>{
 const state={onboarding:{'example.com':{}},competitors:{'example.com':['Selected'],'other.com':['Other']},reports:{'example.com':{status:'complete'}},answers:[{id:'evidence'}],schedules:{'example.com':{enabled:true}},jobs:[{business:{domain:'example.com'},status:'queued'}]};
 assert.equal(rollbackOnboarding(state),true);assert.equal(state.reports['example.com'],undefined);assert.equal(state.competitors['example.com'],undefined);assert.deepEqual(state.competitors['other.com'],['Other']);assert.equal(state.answers.length,1);assert.equal(state.jobs[0].status,'cancelled');assert.equal(state.schedules['example.com'].enabled,false);assert.deepEqual(state.retiredOnboarding['example.com'].competitors,['Selected']);assert.equal(rollbackOnboarding(state),false);
});
