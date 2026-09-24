import test from 'node:test';
import assert from 'node:assert/strict';
import {compareAnswer,validateCompetitors} from '../server/competitor-analysis.mjs';
import {brandRankings,reportTimeline} from '../src/ai-insights-data.js';
const business={name:'Uplift AI',domain:'upliftai.co'};
test('comparison counts whole names once and includes brands with zero mentions',()=>{
 const row=compareAnswer({answer:'UPLIFT AI and **Semrush**. Semrush again. AhrefsPlus is unrelated.',at:'2026-09-23T12:00:00Z'},business,['Semrush','Ahrefs']);
 assert.deepEqual(row.competitors,['Semrush']);
 const metrics=brandRankings([row],business.name);
 assert.equal(metrics.find(b=>b.name==='Ahrefs').visibility,0);
 assert.equal(metrics.find(b=>b.name==='Semrush').sov,50);
 assert.equal(metrics.find(b=>b.own).sov,50);
 assert.equal(reportTimeline([row],business.name,['Ahrefs'],'visibility').series[0].points[0].value,0);
});
test('does not turn citation destinations into brand mentions or fabricate missing evidence',()=>{
 const row=compareAnswer({answer:'[Read more](https://semrush.com) https://ahrefs.com',position:null,sentiment:'Not assessed'},business,['Semrush','Ahrefs']);
 assert.deepEqual(row.competitors,[]);
 assert.equal(brandRankings([row],business.name)[0].sov,null);
 assert.equal(row.competitorMetrics.Semrush.position,null);
 assert.equal(compareAnswer(row,business,[]).comparisonAssessed,false);
});
test('rejects ambiguous configuration and allows clearing the comparison list',()=>{
 assert.deepEqual(validateCompetitors([],business.name),[]);
 for(const names of [['SEM RUSH','sem-rush'],['Uplift AI'],['!!!'],Array(13).fill('a')])assert.throws(()=>validateCompetitors(names,business.name));
});
test('switching competitor lists retains measured results for the business and each tracked brand',()=>{
 const old=compareAnswer({id:'old',prompt:'Which platform?',engine:'ChatGPT Search',answer:'Uplift AI and Semrush',at:'2026-09-22T12:00:00Z'},business,['Semrush']);
 const recent=compareAnswer({id:'new',prompt:'Which platform?',engine:'ChatGPT Search',answer:'Uplift AI and Ahrefs',at:'2026-09-23T12:00:00Z'},business,['Ahrefs']);
 const brands=brandRankings([old,recent],business.name);
 assert.equal(brands.find(b=>b.own).visibility,100);
 assert.equal(brands.find(b=>b.name==='Semrush').visibility,100);
 assert.equal(brands.find(b=>b.name==='Ahrefs').visibility,100);
 assert.equal(brands.find(b=>b.own).sampleSize,2);
 assert.equal(brands.find(b=>b.name==='Semrush').sampleSize,1);
 assert.equal(brands.find(b=>b.own).sov,50);
});
