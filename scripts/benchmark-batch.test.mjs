import test from 'node:test';
import assert from 'node:assert/strict';
import {runBenchmarkBatch} from '../server/benchmark-batch.mjs';
import {hasEarlyResults,followAnalysisJob} from '../src/analysis-jobs-client.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const questions=Array.from({length:100},(_,i)=>({id:String(i)}));
test('overlaps four searches and four independent assessments with no repeated collection',async()=>{
 let active=0,peak=0,calls=0;const saved=new Map(),completed=[];
 const work=async()=>{calls++;peak=Math.max(peak,++active);await delay(15);active--;};
 const options={questions,completed,findAnswer:q=>saved.get(q.id),collect:async q=>{await work();saved.set(q.id,{answer:{}});},assess:async(q,row)=>{await work();row.answer.brandAssessment={};},finish:async q=>completed.push(q.id)};
 await runBenchmarkBatch(options);assert.equal(peak,4);assert.equal(saved.size,4);assert.equal(completed.length,0);
 await runBenchmarkBatch(options);assert.equal(calls,8);assert.deepEqual(completed,['0','1','2','3']);
 await runBenchmarkBatch(options);assert.equal(saved.size,8);assert.equal(calls,12);
});
test('failed tasks do not discard successful siblings or release the lease before they finish',async()=>{
 const saved=[],finished=[];let active=0;
 await assert.rejects(runBenchmarkBatch({questions,completed:[],findAnswer:()=>null,collect:async q=>{active++;try{if(q.id==='0')throw Error('Provider failure');await delay(20);saved.push(q.id);}finally{active--;}},assess:async()=>{},finish:async q=>finished.push(q.id)}),/Provider failure/);
 assert.equal(active,0);assert.deepEqual(saved,['1','2','3']);assert.equal(finished.length,0);
});
test('resumes saved answers first and never recollects completed questions',async()=>{
 let searches=0,assessments=0;const completed=['0'];const saved=new Map([['1',{answer:{}}],['2',{answer:{brandAssessment:{}}}]]);
 await runBenchmarkBatch({questions,completed,findAnswer:q=>saved.get(q.id),collect:async()=>searches++,assess:async()=>assessments++,finish:async q=>completed.push(q.id)});
 assert.equal(searches,0);assert.equal(assessments,1);assert.deepEqual([...completed].sort(),['0','1','2']);
});
test('opens early results at four measured answers without marking the job complete',async()=>{
 const job={id:'job',status:'running',target:100,progress:23,profile:{name:'Acme'}};
 assert.equal(hasEarlyResults({...job,progress:22}),false);assert.equal(hasEarlyResults({...job,status:'failed'}),false);assert.equal(hasEarlyResults({...job,profile:null}),false);
 const result=await followAnalysisJob('job',{request:async()=>({job}),isReady:hasEarlyResults,sleep:async()=>{throw Error('Should not wait for all 100');}});
 assert.equal(result.status,'running');assert.equal(result.id,'job');
});
