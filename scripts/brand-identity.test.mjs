import test from 'node:test';
import assert from 'node:assert/strict';
import {assessmentAliases,canonicalWebsiteName,domainBrandLabel,needsIdentityReview} from '../server/brand-identity.mjs';
import {namedEvidence} from '../server/evidence-normalization.mjs';
import {compareAnswer} from '../server/competitor-analysis.mjs';
import {applyAssessment} from '../server/ai-analysis.mjs';

test('regional website names keep the actual business identity',()=>{
 assert.equal(domainBrandLabel('www.adidas.co.in'),'adidas');
 assert.equal(canonicalWebsiteName('Adidas India','adidas.co.in'),'Adidas');
 assert.equal(canonicalWebsiteName('adidas IN','adidas.co.in'),'adidas');
 assert.equal(canonicalWebsiteName('WeDone AI','wedone.ai'),'WeDone AI');
 assert.equal(canonicalWebsiteName('On India','on.com'),'On India');
 const business={name:'adidas IN',domain:'adidas.co.in'};
 const aliases=assessmentAliases(business,null,['Nike']);
 assert.deepEqual(aliases['adidas IN'],['adidas']);
 assert.equal(needsIdentityReview({brandAssessment:{'adidas IN':{mentioned:false}}},business,aliases),true);
 assert.equal(needsIdentityReview({brandAssessment:{'adidas IN':{}},assessmentAliases:aliases},business,aliases),false);
 const compared=compareAnswer({answer:'Nike and Adidas make running shoes.'},business,['Nike'],aliases);
 assert.equal(compared.mentioned,true);
 assert.deepEqual(compared.competitors,['Nike']);
});

test('a common short word is not counted as a competitor brand',()=>{
 assert.equal(namedEvidence('Choose shoes based on fit.','On'),false);
 assert.equal(namedEvidence('| **On** | running shoes |','On'),true);
 const row=compareAnswer({answer:'Choose shoes based on fit.'},{name:'adidas',domain:'adidas.co.in'},['On']);
 assert.deepEqual(row.competitors,[]);
 const historic={brandAssessment:{adidas:{},On:{}},trackedCompetitors:['On'],measurementVersion:2};
 assert.equal(needsIdentityReview(historic,{name:'adidas'},{adidas:[]}),true);
});

test('verified regional alias repairs mention without inventing sentiment or ranking',()=>{
 const answer='Adidas appears in this comparison. Nike is also listed.';
 const assessment={brands:[
  {name:'adidas IN',mentioned:true,mentionEvidence:'Adidas appears in this comparison.',recommended:null,recommendationEvidence:'',sentiment:'Not assessed',sentimentEvidence:'',position:null,positionEvidence:''},
  {name:'Nike',mentioned:true,mentionEvidence:'Nike is also listed.',recommended:null,recommendationEvidence:'',sentiment:'Not assessed',sentimentEvidence:'',position:null,positionEvidence:''}
 ]};
 const aliases={'adidas IN':['Adidas']};
 const result=applyAssessment({answer},assessment,['adidas IN','Nike'],'adidas IN',aliases);
 assert.equal(result.mentioned,true);
 assert.equal(result.recommended,null);
 assert.equal(result.position,null);
 assert.deepEqual(result.competitors,['Nike']);
 assert.equal(needsIdentityReview(result,{name:'adidas IN'},aliases),false);
});
