import test from 'node:test';
import assert from 'node:assert/strict';
import {currentWebsiteState,selectCurrentWebsite} from '../src/current-website.mjs';
test('switching websites replaces the current profile instead of accumulating history',()=>{
 const first={domain:'first.example',name:'First'},second={domain:'second.example',name:'Second'};
 const before=currentWebsiteState(first),after=currentWebsiteState(second);
 assert.deepEqual(Object.keys(before.profiles),['first.example']);assert.deepEqual(Object.keys(after.profiles),['second.example']);
 assert.deepEqual(selectCurrentWebsite(JSON.parse(JSON.stringify(after))),after);
});
test('legacy website history is reduced to the active site, never another site',()=>{
 const profiles={'a.example':{domain:'a.example'},'b.example':{domain:'b.example'}};
 assert.deepEqual(Object.keys(selectCurrentWebsite({active:'b.example',profiles}).profiles),['b.example']);
 assert.deepEqual(selectCurrentWebsite({active:'missing.example',profiles}),{active:'',profiles:{}});
});
