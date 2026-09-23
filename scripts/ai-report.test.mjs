import test from 'node:test';
import assert from 'node:assert/strict';
import { reportMetrics } from '../src/ai-insights-data.js';
test('brand comparisons derive share, sentiment and rank only from observed evidence',()=>{
 const rows=[{mentioned:true,position:2,sentiment:'Positive',competitors:['Other'],competitorMetrics:{Other:{position:1,sentiment:'Neutral'}}},{mentioned:false,position:null,sentiment:'Not assessed',competitors:['Other'],competitorMetrics:{Other:{position:3,sentiment:'Negative'}}}];
 const metrics=reportMetrics(rows,'Acme');
 const own=metrics.find(r=>r.own),other=metrics.find(r=>!r.own);
 assert.equal(own.visibility,50);assert.ok(Math.abs(own.sov-100/3)<1e-8);assert.equal(own.position,2);assert.equal(own.sentiment,100);
 assert.equal(other.visibility,100);assert.equal(other.position,2);assert.equal(other.sentiment,25);
 assert.ok(Math.abs(metrics.reduce((sum,r)=>sum+r.sov,0)-100)<1e-8);
 const missing=reportMetrics([{mentioned:false,competitors:['Other']}],'Acme');
 assert.equal(missing.find(r=>!r.own).sentiment,null);assert.equal(missing.find(r=>r.own).position,null);
 assert.equal(reportMetrics([],'Acme')[0].visibility,null);
});

test('known brands retain zero mention days while missing positions remain null', async()=>{
 const {reportTimeline}=await import('../src/ai-insights-data.js');
 const rows=[{at:'2026-09-21T12:00:00Z',mentioned:true,competitors:['Other'],position:1},{at:'2026-09-22T12:00:00Z',mentioned:true,competitors:[],position:2},{at:'2026-09-23T12:00:00Z',mentioned:false,competitors:[],position:null}];
 rows.forEach(r=>r.trackedCompetitors=['Other']);
 const points=metric=>reportTimeline(rows,'Acme',['Other'],metric).series[0].points.map(p=>p.value);
 assert.deepEqual(points('visibility'),[100,0,0]);
 assert.deepEqual(points('sov'),[50,0,null]);
 assert.deepEqual(points('position'),[null,null,null]);
 const weekly=reportTimeline(rows,'Acme',['Other'],'visibility','Weekly');
 assert.equal(weekly.days.length,1);assert.ok(Math.abs(weekly.series[0].points[0].value-100/3)<1e-8);
});

test('unassessed competitor collection never implies 100 percent share of voice', () => {
 const rows=[{mentioned:true,competitors:[],comparisonAssessed:false,sentiment:'Not assessed',position:null}];
 const metrics=reportMetrics(rows,'Uplift AI');
 assert.equal(metrics[0].visibility,100);
 assert.equal(metrics[0].sov,null);
 assert.equal(metrics[0].sentiment,null);
 assert.equal(metrics[0].position,null);
});
