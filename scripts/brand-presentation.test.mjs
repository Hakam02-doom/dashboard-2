import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBrandDomain } from '../src/brand-domains.js';
import { brandLogoSources } from '../src/brand-logo-sources.js';
import { brandColor } from '../src/brand-colors.js';

test('product aliases have logos without requiring a citation to their own site', () => {
  for (const [name, domain] of [
    ['Claude by Anthropic', 'claude.ai'], ['Kimi AI', 'kimi.com'],
    ['Canva AI', 'canva.com'], ['GitHub Copilot', 'github.com'],
    ['Adobe Firefly', 'firefly.adobe.com'], ['NotebookLM by Google', 'notebooklm.google.com'],
    ['Duck.ai', 'duck.ai'], ['Mistral Vibe', 'mistral.ai'], ['Cursor', 'cursor.com'],
  ]) {
    assert.equal(resolveBrandDomain(name), domain);
    const sources = brandLogoSources(name);
    assert.equal(sources.length, 2);
    assert.ok(sources.every(url => url.includes(domain)));
  }
});

test('known logos use local assets first and external fallback providers', () => {
  const sources = brandLogoSources('Uplift AI', 'upliftai.co');
  assert.equal(sources[0], '/brands/uplift-ai.png');
  assert.match(sources[1], /google\.com/);
  assert.match(sources[2], /duckduckgo\.com/);
});

test('new businesses use their real supplied or cited domain without invented domains', () => {
  assert.deepEqual(brandLogoSources('Unknown Company'), []);
  assert.equal(resolveBrandDomain('northwind.tools'), 'northwind.tools');
  assert.ok(brandLogoSources('Different Company', 'https://www.acme.com/about').every(url => url.includes('acme.com')));
  assert.ok(brandLogoSources('Canva', 'unrelated-business.com').every(url => url.includes('unrelated-business.com')));
  assert.equal(resolveBrandDomain('New Acme', ['https://acme.com/about']), 'acme.com');
});

test('brand colors are stable across aliases, domain formats and sort order', () => {
  assert.equal(brandColor({ name: 'Claude' }), '#d97757');
  assert.equal(brandColor({ name: 'Claude by Anthropic' }), brandColor({ name: 'Claude', domain: 'https://www.claude.ai/login' }));
  assert.equal(brandColor({ name: 'ChatGPT' }), '#10a37f');
  assert.equal(brandColor({ name: 'Canva AI' }), '#00c4cc');
  const names = ['New Acme', 'Other company', 'Third brand', 'Fourth business'];
  const colors = new Map(names.map(name => [name, brandColor({ name })]));
  for (const name of names.reverse()) assert.equal(brandColor({ name }), colors.get(name));
  assert.ok(new Set(colors.values()).size > 1);
});
