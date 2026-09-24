import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { LOCATION_REGIONS } from '../src/location-regions.js';

test('location view separates selected places from measured regional scores', async () => {
  const world = JSON.parse(await readFile(new URL('../public/world-regions.json', import.meta.url)));
  assert.ok(LOCATION_REGIONS.includes('Canada'));
  assert.ok(LOCATION_REGIONS.includes('India'));
  assert.ok(LOCATION_REGIONS.every(name => world.features.some(feature => feature.properties.ADMIN === name)));

  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true } });
  try {
    const { InsightPages } = await vite.ssrLoadModule('/src/InsightPages.jsx');
    const business = { name: 'Netflix', domain: 'netflix.com', url: 'https://netflix.com' };
    const base = { tab: 6, prior: [], business, selectedLocation: 'Canada', onSelectLocation() {}, onReview() {}, onTrack() {}, rows: [
      { id: 'one', at: new Date().toISOString(), prompt: 'Which service?', location: 'Not specified', mentioned: true, sentiment: 'Positive', sources: [] },
    ] };
    const unmeasured = renderToStaticMarkup(React.createElement(InsightPages, base));
    assert.match(unmeasured, /No regional measurements for Canada yet/);
    assert.match(unmeasured, /excluded from regional scores/);
    assert.match(unmeasured, /Map focused on Canada/);
    assert.doesNotMatch(unmeasured, /100\.0%/);

    const measured = renderToStaticMarkup(React.createElement(InsightPages, { ...base, rows: [
      { ...base.rows[0], id: 'two', location: 'Canada' },
      { ...base.rows[0], id: 'three', location: 'Canada', mentioned: false },
    ] }));
    assert.match(measured, /50\.0%/);
    assert.match(measured, /View measured answers/);
  } finally {
    await vite.close();
  }
});
