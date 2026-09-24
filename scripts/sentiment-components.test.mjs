import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('single-day sentiment uses a measured breakdown and compact pending-analysis states', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true } });
  try {
    const { InsightPages } = await vite.ssrLoadModule('/src/InsightPages.jsx');
    const business = { name: 'Example', domain: 'example.com', url: 'https://example.com' };
    const rows = ['Positive', 'Neutral'].map((sentiment, index) => ({
      id: `answer-${index}`, at: '2026-09-24T12:00:00Z', prompt: `Question ${index + 1}?`,
      answer: 'A measured answer.', engine: 'OpenAI Web Search', topic: 'Buyer questions',
      mentioned: true, cited: false, sources: [], competitors: ['Another brand'], sentiment,
      brandAssessment: { Example: { sentimentEvidence: 'A cited excerpt about Example.' } },
    }));
    const html = renderToStaticMarkup(React.createElement(InsightPages, {
      tab: 2, rows, prior: [], business, brand: business.name, cadence: 'Daily',
      annotations: {}, reviews: {}, onReview() {}, onTrack() {},
    }));
    assert.match(html, /75\.0/);
    assert.match(html, /1 positive, 1 neutral, 0 negative/);
    assert.match(html, /Based on 2 assessed mentions/);
    assert.doesNotMatch(html, /Brand sentiment over time/);
    assert.doesNotMatch(html, /aria-label="Line chart"/);
    assert.match(html, /No supported attributes extracted yet/);
    assert.match(html, /No claims extracted yet/);
    assert.doesNotMatch(html, /Show all 0/);
  } finally {
    await vite.close();
  }
});
