import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBrandDomain,publicDomain} from '../src/brand-domains.js';
test('resolves varied competitor names from cited domains without guessing',()=>{
 const sources=['https://www.wix.com/studio','https://wordpress.com/business','https://www.figma.com/sites','https://www.duda.co/'];
 assert.equal(resolveBrandDomain('Wix / Wix Studio',sources),'wix.com');
 assert.equal(resolveBrandDomain('WordPress.com',sources),'wordpress.com');
 assert.equal(resolveBrandDomain('Figma Sites',sources),'figma.com');
 assert.equal(resolveBrandDomain('Duda',sources),'duda.co');
 assert.equal(resolveBrandDomain('Unknown Business',sources),'');
 assert.equal(resolveBrandDomain('Different Name',sources,[{name:'Different Name',domain:'duda.co'}]),'duda.co');
 assert.equal(resolveBrandDomain('Different Name',sources,[{name:'Different Name',domain:'invented.com'}]),'');
 assert.equal(publicDomain('http://127.0.0.1:5174'),'');
});
