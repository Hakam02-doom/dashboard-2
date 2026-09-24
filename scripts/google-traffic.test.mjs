import test from 'node:test';
import assert from 'node:assert/strict';
import {createGoogleTraffic,validateGoogleProperties,normalizeGa4Report,normalizeGscReport} from '../server/google-traffic.mjs';
import {searchapiHandler} from '../server/searchapi-handler.mjs';
import {Readable} from 'node:stream';
const business={name:'Acme',domain:'acme.com'};
test('Google properties are restricted to the selected business and never imply access',()=>{
 assert.deepEqual(validateGoogleProperties({ga4PropertyId:'12345678',gscSiteUrl:'sc-domain:acme.com'},business.domain),{ga4PropertyId:'12345678',gscSiteUrl:'sc-domain:acme.com'});
 assert.throws(()=>validateGoogleProperties({ga4PropertyId:'123abc',gscSiteUrl:''},business.domain),/digits/);
 assert.throws(()=>validateGoogleProperties({ga4PropertyId:'',gscSiteUrl:'sc-domain:other.com'},business.domain),/this business/);
 assert.equal(createGoogleTraffic().configured,false);
});
test('GA4 counts only known AI referrers and Search Console labels separate organic metrics',()=>{
 const row=(source,path,sessions)=>({dimensionValues:[{value:source},{value:path}],metricValues:[{value:String(sessions)}]});
 const ga4=normalizeGa4Report({rows:[row('chatgpt.com','/article',4),row('perplexity.ai','/article',2),row('google','/article',100)]});
 assert.equal(ga4.visits,6);assert.equal(ga4.pages[0].visits,6);assert.equal(ga4.engines.length,2);
 assert.deepEqual(normalizeGscReport({rows:[{keys:['query','https://acme.com/article'],clicks:3,impressions:25,ctr:.12,position:5.2}]}),[{query:'query',page:'https://acme.com/article',clicks:3,impressions:25,ctr:.12,position:5.2}]);
});
test('traffic report requires owned property configuration and preserves unrelated business state',async()=>{
 let state={attempts:0,answers:[]};const store={kind:'test',load:async()=>state,save:async s=>{state=structuredClone(s);},acquire:async()=> 'lease',release:async()=>{}};
 const googleTraffic={configured:true,serviceAccount:'readonly@example.com',report:async()=>({at:'2026-09-24',ga4:{visits:6},gsc:null,errors:{}})};
 const handler=searchapiHandler({local:true,store,googleTraffic});
 const call=async body=>{const req=Readable.from([JSON.stringify({business,...body})]);req.method='POST';req.headers={origin:'http://127.0.0.1:5174',host:'127.0.0.1:5174','content-type':'application/json'};const res={setHeader(){},end(text){this.body=JSON.parse(text);}};await handler(req,res);return res;};
 assert.equal((await call({action:'trafficReport'})).body.traffic.status,'not-connected');
 assert.equal((await call({action:'googleProperties',properties:{ga4PropertyId:'12345678',gscSiteUrl:'sc-domain:other.com'}})).statusCode,400);
 assert.equal((await call({action:'googleProperties',properties:{ga4PropertyId:'12345678',gscSiteUrl:'sc-domain:acme.com'}})).statusCode,200);
 assert.equal((await call({action:'trafficReport'})).body.traffic.ga4.visits,6);
 assert.equal(state.googleProperties['other.com'],undefined);
});
