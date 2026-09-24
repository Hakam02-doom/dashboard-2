import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("Mentions page renders measured evidence and reference controls without inventing prior data", async () => {
  const vite = await createServer({ optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true }, appType: "custom" });
  try {
    const { MentionsPage } = await vite.ssrLoadModule("/src/MentionsPage.jsx");
    const rows = [
      { id:"a", at:"2026-09-24T12:00:00Z", engine:"ChatGPT Search", prompt:"Which running shoes are best?", promptId:"q1", topic:"Running", answer:"Nike and Adidas are both options.", mentioned:true, cited:true, position:1, competitors:["Adidas"], sources:["https://nike.com/shoes"], competitorMetrics:{Adidas:{position:2}} },
      { id:"b", at:"2026-09-24T13:00:00Z", engine:"ChatGPT Search", prompt:"Which running shoes are best?", promptId:"q1", topic:"Running", answer:"Adidas is an option.", mentioned:false, cited:false, position:null, competitors:["Adidas"], sources:["https://example.com/review"], competitorMetrics:{Adidas:{position:1}} },
    ];
    const html = renderToStaticMarkup(React.createElement(MentionsPage, {
      rows, prior:[], business:{name:"Nike",domain:"nike.com"}, brand:"Nike",
      cadence:"Daily", plan:{questions:[{id:"q1",intent:"Discovery"}]},
      annotations:{}, onDetail:()=>{}, onAnswer:()=>{},
    }));
    assert.match(html, /Total Mentions/);
    assert.match(html, /Total Citations/);
    assert.match(html, /Decision Journey/);
    assert.match(html, /Position Distribution/);
    assert.match(html, /Group: Prompt/);
    assert.match(html, /Mentioned &amp; Cited/);
    assert.match(html, /2 responses/);
    assert.match(html, /Learn/);
    assert.doesNotMatch(html, /vs previous period/);
    const { InsightPages } = await vite.ssrLoadModule("/src/InsightPages.jsx");
    const wrapped = renderToStaticMarkup(React.createElement(InsightPages, {
      tab:1, rows, prior:[], business:{name:"Nike",domain:"nike.com"},
      brand:"Nike", cadence:"Daily", plan:{questions:[{id:"q1",intent:"Discovery"}]},
      annotations:{}, reviews:{}, library:[], onReview:async()=>{},
      onTrack:async()=>{}, evidence:null, onClearEvidence:()=>{},
    }));
    assert.match(wrapped, /Decision Journey/);
  } finally {
    await vite.close();
  }
});
