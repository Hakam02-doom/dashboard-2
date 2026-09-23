import test from 'node:test';
import assert from 'node:assert/strict';
import { websiteUrl, isPublicAddress, extractBusiness } from '../server/website-analysis.mjs';
import { validBusiness, businessSuggestions } from '../src/ai-business.js';
import { filterAnswers, summarizeAnswers, sampleAnswers } from '../src/ai-insights-data.js';

test('rejects private targets, credentials, schemes and ports; strips query secrets', () => {
 for (const url of ['http://example.com','https://127.0.0.1','https://2130706433','https://[::1]','https://user:pass@example.com','https://example.com:8080','file:///etc/passwd','https://foo.local']) assert.throws(()=>websiteUrl(url));
 assert.equal(websiteUrl('example.com/path?token=secret#x').href, 'https://example.com/path');
 for(const ip of ['127.0.0.1','10.2.1.1','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','0.0.0.0','::1','fc00::1','fe80::1','::ffff:127.0.0.1']) assert.equal(isPublicAddress(ip),false,ip);
 assert.equal(isPublicAddress('8.8.8.8'),true);
});
test('extracts observed metadata safely without executing page code', () => {
 const html='<html lang="en"><head><title>Acme | Home</title><meta name="description" content="Tools &amp; services"><script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script></head><body><h1>Helpful tools</h1><script>alert(1)</script><p>Hello world</p></body></html>';
 const business=extractBusiness(html,'https://acme.example/');
 assert.equal(business.name,'Acme');assert.equal(business.description,'Tools & services');assert.deepEqual(business.headings,['Helpful tools']);assert.ok(validBusiness(business));assert.equal(validBusiness({...business,url:'javascript:alert(1)'}),false);
 assert.ok(businessSuggestions(business).every(p=>p.text.includes('Acme')));
});
test('missing observations do not manufacture zero visibility or position', () => {
 assert.deepEqual(summarizeAnswers([]),{total:0,mentions:0,citations:0,visibility:null,citationRate:null,position:null});
 const result=summarizeAnswers([{mentioned:true,cited:false,position:null},{mentioned:false,cited:false,position:0}]);assert.equal(result.visibility,50);assert.equal(result.position,null);
});
test('filters sample evidence consistently by date, engine, topic and prompt type',()=>{
 const now=new Date('2026-09-23T12:00:00Z'), rows=sampleAnswers({name:'Acme',url:'https://acme.example/'},now);
 const filtered=filterAnswers(rows,{engine:'ChatGPT Search',period:7,type:'Branded',topic:'Brand awareness'},now);
 assert.ok(filtered.length); assert.ok(filtered.every(r=>r.engine==='ChatGPT Search'&&r.type==='Branded'&&new Date(r.at)>=new Date('2026-09-17T00:00:00Z')));
 assert.equal(filterAnswers(rows,{engine:'Absent'},now).length,0);
});

test('location filtering excludes other markets',()=>{
 const now=new Date('2026-09-23T12:00:00Z');
 const rows=sampleAnswers({name:'Acme',url:'https://acme.example'},now);
 const filtered=filterAnswers(rows,{location:'India',period:7},now);
 assert.equal(filtered.length,7);
 assert.ok(filtered.every(row=>row.location==='India'));
});
