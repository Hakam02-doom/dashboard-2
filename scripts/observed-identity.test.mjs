import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalWebsiteName} from '../server/brand-identity.mjs';
import {normalizeObservedIdentity} from '../server/observed-identity.mjs';
import {brandRankings} from '../src/ai-insights-data.js';
import {brandLogoSources} from '../src/brand-logo-sources.js';

test('website title decoration is removed only when its prefix matches the domain identity',()=>{
 assert.equal(canonicalWebsiteName('Netflix - Watch TV Shows Online, Watch Movies Online','netflix.com'),'Netflix');
 assert.equal(canonicalWebsiteName('Northwind Tools — Professional equipment','northwindtools.com'),'Northwind Tools');
 assert.equal(canonicalWebsiteName('News - Netflix review','example.com'),'News - Netflix review');
 assert.equal(canonicalWebsiteName('Coca-Cola','coca-cola.com'),'Coca-Cola');
});
test('historical title identities recover explicit mentions without inventing sentiment or ranking',()=>{
 const old='Netflix - Watch movies online';const row={answer:'Netflix offers movies. Disney+ offers movies too.',mentioned:false,brandAssessment:{[old]:{sentiment:'Not assessed',recommended:null,mentionEvidence:''},'Disney+':{mentionEvidence:'Disney+ offers movies too.'}},competitors:['Disney+'],trackedCompetitors:['Disney+'],discoveryComplete:true,comparisonAssessed:false};
 const repaired=normalizeObservedIdentity(row,{name:'Netflix',domain:'netflix.com'});
 assert.equal(repaired.mentioned,true);assert.equal(repaired.position,null);assert.equal(repaired.sentiment,'Not assessed');assert.equal(repaired.recommended,null);assert.ok(repaired.brandAssessment.Netflix.mentionEvidence);assert.equal(repaired.brandAssessment[old],undefined);
 assert.equal(row.mentioned,false);
 const linked=normalizeObservedIdentity({...row,answer:'See [a review](https://netflix.com).'}, {name:'Netflix',domain:'netflix.com'});assert.equal(linked.mentioned,false);
});
test('a fully assessed answer with no competing brands does not blank share of voice',()=>{
 const brands=brandRankings([{mentioned:true,competitors:['Disney+'],trackedCompetitors:['Disney+'],comparisonAssessed:true,discoveryComplete:true},{mentioned:true,competitors:[],trackedCompetitors:[],comparisonAssessed:false,discoveryComplete:true}],'Netflix');
 assert.equal(brands.find(b=>b.own).visibility,100);assert.ok(Math.abs(brands.reduce((sum,b)=>sum+b.sov,0)-100)<1e-8);
 const pending=brandRankings([{mentioned:true,comparisonAssessed:false}],'Netflix');assert.equal(pending[0].sov,null);
});
test('streaming logos resolve to their own services instead of similarly named publishers',()=>{
 for(const brand of ['Netflix','Disney+','Amazon Prime Video','Apple TV+','HBO Max','Hulu','Tubi','Paramount+','YouTube TV','Peacock'])assert.ok(brandLogoSources(brand)[0].startsWith('/brands/'));
 assert.ok(brandLogoSources('Apple TV+').some(url=>url.includes('tv.apple.com')));
});
