import test from 'node:test';
import assert from 'node:assert/strict';
import {coalescedSave} from '../server/coalesced-save.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('concurrent persistence writes are coalesced and all acknowledged revisions are durable',async()=>{
 const snapshots=[];let active=0,peak=0;
 const save=coalescedSave(async s=>{peak=Math.max(peak,++active);await delay(10);snapshots.push(s);active--;});
 const state={answers:[]},pending=[];
 for(let i=0;i<24;i++){state.answers.push(i);pending.push(save(state));}
 await Promise.all(pending);assert.equal(peak,1);assert.equal(snapshots.length,1);assert.equal(snapshots[0].answers.length,24);
});
test('mutations during an in-flight snapshot require a second durable write',async()=>{
 const snapshots=[];const save=coalescedSave(async s=>{await delay(10);snapshots.push(s);});
 const state={n:1};const first=save(state);await delay(1);state.n=2;const second=save(state);await first;assert.equal(snapshots[0].n,1);await second;assert.equal(snapshots.at(-1).n,2);
});
test('failed persistence rejects all callers and allows a later durable retry',async()=>{
 let fail=true;const save=coalescedSave(async()=>{if(fail)throw Error('Storage offline');});
 const results=await Promise.allSettled([save({n:1}),save({n:2})]);assert.ok(results.every(r=>r.status==='rejected'));fail=false;await save({n:3});
});
