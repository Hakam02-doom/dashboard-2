import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKeywordCsv,promptTrend} from '../src/prompt-keywords.js';
import {reportMetrics} from '../src/ai-insights-data.js';
import {promptAnswers} from '../src/prompt-report.js';
test('imports exact keyword values, quoted CSV, zero and provenance',()=>{
 const [r]=parseKeywordCsv('Prompt,Source,Volume,Difficulty,Date,Location\r\n"Best, tools?",Ahrefs,"1,200",0,2026-01-01,US');
 assert.equal(r.volume,1200);assert.equal(r.difficulty,0);assert.equal(r.key,'best, tools?');assert.equal(r.source,'Ahrefs');
 assert.equal(parseKeywordCsv('Prompt,Source,Volume,Difficulty\nx,Provider,,45')[0].volume,null);
});
test('rejects invalid or ambiguous imports atomically',()=>{
 for(const csv of ['Prompt,Volume\nx,5','Prompt,Source,Volume\nx,p,-1','Prompt,Source,Difficulty\nx,p,101','Prompt,Source,Volume\nx,p,10\n X ,p,20','Prompt,Source,Volume\n"x,p,1'])assert.throws(()=>parseKeywordCsv(csv));
});
test('trend uses actual measured days and keeps missing positions empty',()=>{
 const data=[{at:'2026-01-01T10:00:00Z',mentioned:true,sentiment:'Positive',position:2},{at:'2026-01-01T12:00:00Z',mentioned:false},{at:'2026-01-03T12:00:00Z',mentioned:false}];
 const trend=promptTrend(data,'Brand',reportMetrics);assert.equal(trend.length,2);assert.equal(trend[0].visibility,50);assert.equal(trend[1].position,null);
});
test('future and invalid observations cannot affect current prompt metrics',()=>{
 const rows=[{prompt:'x',at:'2099-01-01'},{prompt:'x',at:'invalid'},{prompt:'x',at:'2026-01-01'}];
 assert.equal(promptAnswers({text:'x'},rows,0,new Date('2026-02-01')).length,1);
});
