import test from 'node:test';
import assert from 'node:assert/strict';
import {runBenchmarkBatch} from '../server/benchmark-batch.mjs';
import {hasEarlyResults,followAnalysisJob} from '../src/analysis-jobs-client.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const questions=Array.from({length:100},(_,i)=>({id:String(i)}));
test('pipelines 24 searches into individual assessments without repeated collection',async()=>{
 let active=0,peak=0,calls=0;const saved=new Map(),completed=[];
 const work=async()=>{calls++;peak=Math.max(peak,++active);await delay(10);active--;};
 const options={questions,completed,findAnswer:q=>saved.get(q.id),collect:async q=>{await work();saved.set(q.id,{answer:{}});},assess:async(q,row)=>{await work();row.answer.brandAssessment={};},finish:async q=>completed.push(q.id)};
 await runBenchmarkBatch(options);assert.equal(peak,24);assert.equal(saved.size,24);assert.equal(completed.length,24);assert.equal(calls,48);
 await runBenchmarkBatch(options);assert.equal(saved.size,48);assert.equal(calls,96);
});
test('a fast answer is assessed before a slow sibling search finishes',async()=>{
 const events=[],saved=new Map();
 await runBenchmarkBatch({questions:questions.slice(0,2),completed:[],findAnswer:q=>saved.get(q.id),collect:async q=>{await delay(q.id==='0'?40:1);events.push('search'+q.id);saved.set(q.id,{answer:{}});},assess:async q=>events.push('assess'+q.id),finish:async()=>{}});
 assert.ok(events.indexOf('assess1')<events.indexOf('search0'));
});
test('failures preserve assessed siblings and never release the lease while tasks are active',async()=>{
 const saved=new Map(),finished=[];let active=0;
 await assert.rejects(runBenchmarkBatch({questions:questions.slice(0,4),completed:[],findAnswer:q=>saved.get(q.id),collect:async q=>{active++;try{if(q.id==='0')throw Error('Provider failure');await delay(10);saved.set(q.id,{answer:{}});}finally{active--;}},assess:async(_q,row)=>{row.answer.brandAssessment={};},finish:async q=>finished.push(q.id)}),/Provider failure/);
 assert.equal(active,0);assert.deepEqual(finished,['1','2','3']);
});
test('resumes pending answers first without recollecting completed questions',async()=>{
 let searches=0,assessments=0;const completed=['0'];const saved=new Map([['1',{answer:{}}],['2',{answer:{brandAssessment:{}}}]]);
 await runBenchmarkBatch({questions,completed,concurrency:2,findAnswer:q=>saved.get(q.id),collect:async()=>searches++,assess:async()=>assessments++,finish:async q=>completed.push(q.id)});
 assert.equal(searches,0);assert.equal(assessments,1);assert.deepEqual([...completed].sort(),['0','1','2']);
});
test('opens early results at four measured answers without marking the job complete',async()=>{
 const job={id:'job',status:'running',target:100,progress:23,profile:{name:'Acme'}};
 assert.equal(hasEarlyResults({...job,progress:22}),false);assert.equal(hasEarlyResults({...job,status:'failed'}),false);assert.equal(hasEarlyResults({...job,profile:null}),false);
 const result=await followAnalysisJob('job',{request:async()=>({job}),isReady:hasEarlyResults,sleep:async()=>{throw Error('Should not wait for all 100');}});
 assert.equal(result.status,'running');assert.equal(result.id,'job');
});
