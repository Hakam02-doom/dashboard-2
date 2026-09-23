import test from 'node:test';
import assert from 'node:assert/strict';
import {promptAnswers,promptMetrics,citationDomains,promptReportCsv} from '../src/prompt-report.js';
const p={text:'Best tools?',topic:'Buying',type:'Unbranded',status:'saved',tracking:true};
const at=new Date().toISOString();
const rows=[{prompt:'  BEST tools? ',at,mentioned:true,position:2,sentiment:'Positive',competitors:['Other'],trackedCompetitors:['Other'],comparisonAssessed:true,sources:['https://brand.com/a','https://brand.com/b'],id:'1'},{prompt:'Best tools?',at,mentioned:false,position:null,sentiment:'Not assessed',competitors:[],trackedCompetitors:['Other'],comparisonAssessed:true,sources:['https://elsewhere.com'],id:'2'},{prompt:'Different question',at,mentioned:true,sources:[],id:'3'}];
test('prompt metrics use matching collected answers and leave unmeasured results null',()=>{const m=promptMetrics(p,rows,{name:'Brand'},30);assert.equal(m.visibility,50);assert.equal(m.position,2);assert.equal(m.sentiment,100);assert.equal(m.history.length,2);assert.equal(promptMetrics({text:'Unseen'},rows,{name:'Brand'}).visibility,null);});
test('date filters exclude old evidence and citation counts deduplicate each answer',()=>{assert.equal(promptAnswers(p,[{...rows[0],at:'2000-01-01'}],30).length,0);assert.equal(promptAnswers(p,[{...rows[0],at:'2000-01-01'}],0).length,1);assert.equal(citationDomains(rows.slice(0,2)).find(s=>s.domain==='brand.com').percent,50);});
test('report export preserves blank missing metrics and escapes formulas',()=>{const csv=promptReportCsv([{...p,text:'=bad'}],()=>({history:[],visibility:null}));assert.ok(csv.includes("\"'=bad\""));assert.ok(csv.includes('"Active"'));});

test('previously collected questions appear without duplicating saved or paused prompts',async()=>{
 const {mergeCollectedPrompts,groupPromptMetrics}=await import('../src/prompt-report.js');
 const list=mergeCollectedPrompts([{...p,id:'saved',tracking:false}], [{id:'new',text:'Unseen',topic:'Discovery'}],rows);
 assert.equal(list.filter(x=>x.text===p.text).length,1);assert.equal(list.find(x=>x.id==='saved').tracking,false);
 assert.equal(list.find(x=>x.text==='Different question').tracking,true);assert.equal(list.find(x=>x.text==='Unseen').tracking,false);
 assert.equal(groupPromptMetrics([p],rows,{name:'Brand'},30).visibility,50);
});
