import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAssessment} from '../server/ai-analysis.mjs';
test('requires all brands and rejects invented evidence',()=>{
 const row={answer:'Alpha is useful. Beta is also available.'};
 assert.throws(()=>applyAssessment(row,{brands:[]},['Alpha'],'Alpha'),/incomplete/);
 const r=applyAssessment(row,{brands:[{name:'Alpha',mentioned:true,mentionEvidence:'Alpha is useful.',sentiment:'Positive',sentimentEvidence:'Invented praise',position:1,positionEvidence:'Invented ranking'},{name:'Beta',mentioned:true,mentionEvidence:'Beta is also available.',sentiment:'Neutral',sentimentEvidence:'Beta is also available.',position:null}]},['Alpha','Beta'],'Alpha');
 assert.equal(r.mentioned,true);assert.equal(r.position,null);assert.equal(r.sentiment,'Not assessed');assert.deepEqual(r.competitors,['Beta']);
});

import {validatePlan} from '../server/ai-analysis.mjs';
test('question plan enforces balanced intent, uniqueness and no brand leakage',()=>{
 const intents=['Discovery','Comparison','Buying decisions','Use cases'];
 const plan={questions:Array.from({length:24},(_,i)=>({text:`Which marketing platform supports workflow number ${i+1}?`,intent:intents[Math.floor(i/6)],topic:'Marketing'}))};
 assert.equal(validatePlan(plan,['Uplift AI']).questions.length,24);
 assert.throws(()=>validatePlan({...plan,questions:plan.questions.slice(1)},[]),/24/);
 assert.throws(()=>validatePlan({...plan,questions:plan.questions.map((q,i)=>i===0?{...q,text:'Which Uplift AI platform should I buy?'}:q)},['Uplift AI']),/branded/);
 assert.throws(()=>validatePlan({...plan,questions:plan.questions.map((q,i)=>i===1?plan.questions[0]:q)},[]),/duplicated/);
});
test('numbered topic headings are not brand rankings',()=>{
 const row={answer:'### 1. SEO platforms\nAlpha is useful.'};
 const r=applyAssessment(row,{brands:[{name:'Alpha',mentioned:true,mentionEvidence:'Alpha is useful.',sentiment:'Positive',sentimentEvidence:'Alpha is useful.',position:1,positionEvidence:row.answer}]},['Alpha'],'Alpha');
 assert.equal(r.position,null);
});
