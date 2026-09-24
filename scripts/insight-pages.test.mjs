import test from "node:test";
import assert from "node:assert/strict";
import {
  brandRows,
  sourceRows,
  sourceDomainRows,
  fanoutRows,
  sentimentData,
  bucketRows,
} from "../src/insight-pages-data.js";
import { verifyInsights } from "../server/insight-enrichment.mjs";
const row = {
  id: "a",
  at: "2026-09-23T12:00:00Z",
  prompt: "Compare tools",
  mentioned: true,
  cited: true,
  position: null,
  sentiment: "Positive",
  answer: "Acme includes an editor for designing responsive websites.",
  sources: [
    "https://acme.com/guide",
    "https://acme.com/guide",
    "javascript:alert(1)",
  ],
  fanout: ["Acme pricing", " acme   pricing "],
  competitors: ["Other"],
  brandAssessment: { Other: { position: 2, sentiment: "Neutral" } },
};
test("citations count each URL once per answer and reject non-web sources", () => {
  const result = sourceRows([row], "acme.com");
  assert.equal(result.length, 1);
  assert.equal(result[0].count, 1);
  assert.equal(result[0].used, 100);
  assert.equal(result[0].growth, null);
});
test("domain totals count distinct answers after URL filtering", () => {
  const second = { ...row, id: "b", sources: ["https://acme.com/guide", "https://acme.com/news"] };
  const sources = sourceRows([row, second], "acme.com");
  const domains = sourceDomainRows(sources, 2);
  assert.equal(domains[0].count, 2);
  assert.equal(domains[0].used, 100);
  assert.equal(domains[0].rows.length, 2);
  assert.equal(sourceDomainRows(sources.filter((source) => source.url.endsWith("/news")), 2)[0].count, 1);
});
test("a later answer can provide source format metadata", () => {
  const later = { ...row, id: "b", sourceMetadata: { "https://acme.com/guide": { contentType: "Article" } } };
  assert.equal(sourceRows([row, later], "acme.com")[0].contentType, "Article");
  assert.equal(sourceRows([row], "acme.com", [], { "https://acme.com/guide": { contentType: "Guide" } })[0].contentType, "Guide");
});
test("fanout coverage respects active tracking and normalizes equivalent queries", () => {
  const result = fanoutRows(
    [row],
    [{ text: "ACME pricing", tracking: true, status: "saved" }],
  )[0];
  assert.equal(result.count, 1);
  assert.equal(result.queries[0].count, 2);
  assert.equal(result.coverage, 100);
  assert.equal(
    fanoutRows(
      [row],
      [{ text: "Acme pricing", tracking: true, status: "archived" }],
    )[0].coverage,
    0,
  );
});
test("sentiment excludes unassessed and absent brand answers", () => {
  assert.equal(
    sentimentData([
      row,
      { ...row, mentioned: false, sentiment: "Negative" },
      { ...row, sentiment: "Not assessed" },
    ]).score,
    100,
  );
  assert.equal(sentimentData([]).score, null);
  const projected = brandRows([row], "Other", "Acme")[0];
  assert.equal(projected.position, 2);
  assert.equal(projected.cited, null);
});
test("weekly bucketing does not invent observations on empty dates", () => {
  assert.equal(bucketRows([row], "Weekly")[0][0], "2026-09-21");
  assert.equal(bucketRows([row]).length, 1);
});
test("insight facts and attributes require brand-specific quotes in the original answer", () => {
  const quote = row.answer;
  const data = verifyInsights(
    {
      answers: [
        {
          id: "a",
          stage: "Consider",
          facts: [
            { brand: "Acme", quote },
            {
              brand: "Acme",
              quote: "Acme has 100 million customers globally.",
            },
          ],
          attributes: [
            {
              brand: "Acme",
              label: "Visual editor",
              sentiment: "Positive",
              quote,
            },
            {
              brand: "Other",
              label: "Visual editor",
              sentiment: "Positive",
              quote,
            },
          ],
        },
      ],
    },
    [row],
    ["Acme", "Other"],
  );
  assert.equal(data.a.facts.length, 1);
  assert.equal(data.a.attributes.length, 1);
  assert.equal(data.a.stage, "Consider");
});
