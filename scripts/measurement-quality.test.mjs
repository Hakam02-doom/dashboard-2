import test from 'node:test';
import assert from 'node:assert/strict';
import {uniqueObservations,measurementQuality,wilsonInterval} from '../src/measurement-quality.js';
import {reportMetrics} from '../src/ai-insights-data.js';
import {applyAssessment} from '../server/ai-analysis.mjs';
import {validateMeasurementProfile} from '../server/measurement-profile.mjs';
const observation={at:'2026-09-23T08:00:00Z',prompt:'Which tool?',engine:'ChatGPT Search',mentioned:false,competitors:['Beta'],trackedCompetitors:['Beta'],comparisonAssessed:true};
test('same-day duplicates do not increase observations; another engine or day does',()=>{
 const rows=[observation,{...observation,at:'2026-09-23T09:00:00Z'},{...observation,at:'2026-09-24T08:00:00Z'},{...observation,engine:'Gemini'}];
 assert.equal(uniqueObservations(rows).length,3);const q=measurementQuality(rows,{name:'Alpha'});assert.equal(q.duplicates,1);assert.equal(q.days,2);assert.equal(q.recommendationRate,null);assert.equal(q.headToHead[0].competitorOnly,3);
});
test('competitor comparison uses each brand’s measured answers, not untracked answers as zeros',()=>{
 const r=reportMetrics([observation,{...observation,at:'2026-09-24T08:00:00Z',mentioned:true,competitors:['Gamma'],trackedCompetitors:['Gamma']}],'Alpha');
 assert.equal(r.find(b=>b.name==='Alpha').visibility,50);
 assert.equal(r.find(b=>b.name==='Beta').visibility,100);
 assert.equal(r.find(b=>b.name==='Gamma').visibility,100);
 assert.equal(r.find(b=>b.name==='Beta').sampleSize,1);
 assert.equal(r.find(b=>b.name==='Gamma').sampleSize,1);
 assert.ok(r.every(b=>b.position===null));
});
test('zero mentions have a nonzero uncertainty upper bound; empty samples have none',()=>{
 assert.equal(wilsonInterval(0,0),null);const interval=wilsonInterval(0,27);assert.ok(interval[0]<1e-10&&interval[1]>10);
});
test('reviewed aliases require unique identities and explicit review',()=>{
 assert.throws(()=>validateMeasurementProfile({reviewed:false},['Alpha']),/Confirm/);
 assert.throws(()=>validateMeasurementProfile({reviewed:true,aliases:{Alpha:['Beta']}},['Alpha','Beta']),/two/);
 assert.deepEqual(validateMeasurementProfile({reviewed:true,aliases:{Alpha:['Alpha Suite']}},['Alpha']).aliases.Alpha,['Alpha Suite']);
});
test('recommendations require brand-specific evidence; aliases match while unrelated quotes do not',()=>{
 const row={answer:'I recommend Alpha Suite for reporting. Beta is mentioned as an alternative.'};
 const assessment={brands:[{name:'Alpha',mentioned:true,mentionEvidence:'I recommend Alpha Suite for reporting.',recommended:true,recommendationEvidence:'I recommend Alpha Suite for reporting.',sentiment:'Not assessed',sentimentEvidence:'',position:null},{name:'Gamma',mentioned:true,mentionEvidence:'Beta is mentioned as an alternative.',recommended:true,recommendationEvidence:'I recommend Alpha Suite for reporting.',sentiment:'Not assessed',sentimentEvidence:'',position:null}]};
 const r=applyAssessment(row,assessment,['Alpha','Gamma'],'Alpha',{Alpha:['Alpha Suite']});assert.equal(r.recommended,true);assert.ok(!r.competitors.includes('Gamma'));assert.equal(r.brandAssessment.Gamma.recommended,null);
});
