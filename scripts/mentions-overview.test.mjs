import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('single-day mentions and citations show measured coverage instead of isolated trend points', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true } });
  try {
    const { MentionsPage } = await vite.ssrLoadModule('/src/MentionsPage.jsx');
    const business = { name: 'Example', domain: 'example.com', url: 'https://example.com' };
    const rows = Array.from({ length: 40 }, (_, index) => ({
      id: `answer-${index}`, at: '2026-09-24T12:00:00Z', prompt: `Question ${index + 1}?`,
      answer: 'A measured answer.', engine: 'OpenAI Web Search', topic: 'Buyer questions',
      mentioned: index < 34, cited: false, sources: [], competitors: [], sentiment: 'Not assessed',
    }));
    const html = renderToStaticMarkup(React.createElement(MentionsPage, { rows, business, brand: business.name, onAnswer() {}, onDetail() {} }));
    assert.match(html, /85%/);
    assert.match(html, /34 of 40 assessed answers mention Example/);
    assert.match(html, /0%/);
    assert.match(html, /34<\/strong>/);
    assert.match(html, /Mentioned without a citation/);
    assert.equal((html.match(/class="is-mentioned" aria-label="Question/g) || []).length, 34);
    assert.doesNotMatch(html, /Mentions line chart/);
  } finally {
    await vite.close();
  }
});
