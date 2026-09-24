import { evidenceText, namedEvidence } from "./evidence-normalization.mjs";
const str = { type: "string" },
  obj = (properties) => ({
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  });
export const insightSchema = obj({
  answers: {
    type: "array",
    items: obj({
      id: str,
      stage: {
        type: "string",
        enum: ["Learn", "Consider", "Purchase", "Unclassified"],
      },
      attributes: {
        type: "array",
        items: obj({
          brand: str,
          label: str,
          sentiment: {
            type: "string",
            enum: ["Positive", "Neutral", "Negative"],
          },
          quote: str,
        }),
      },
      facts: { type: "array", items: obj({ brand: str, quote: str }) },
    }),
  },
});
export function verifyInsights(result, rows, names) {
  return Object.fromEntries(
    rows.map((row) => {
      const candidate = result.answers?.find((a) => a.id === row.id),
        text = evidenceText(row.answer);
      const valid = (item) =>
        names.includes(item.brand) &&
        typeof item.quote === "string" &&
        item.quote.length >= 15 &&
        text.includes(evidenceText(item.quote)) &&
        namedEvidence(item.quote, item.brand);
      return [
        row.id,
        {
          stage: ["Learn", "Consider", "Purchase"].includes(candidate?.stage)
            ? candidate.stage
            : "Unclassified",
          attributes: (candidate?.attributes || [])
            .filter(
              (a) =>
                valid(a) &&
                typeof a.label === "string" &&
                a.label.length <= 80 &&
                ["Positive", "Neutral", "Negative"].includes(a.sentiment),
            )
            .slice(0, 12),
          facts: (candidate?.facts || []).filter(valid).slice(0, 8),
          at: new Date().toISOString(),
          method: "AI classification · verified answer excerpts",
        },
      ];
    }),
  );
}
export const sourceSchema = obj({
  sources: {
    type: "array",
    items: obj({
      url: str,
      contentType: {
        type: "string",
        enum: [
          "Ranked List",
          "Topic Guide",
          "How-To Guide",
          "Review",
          "Comparison",
          "Case Study",
          "Checklist",
          "Alternatives Guide",
          "Product Page",
          "Other",
        ],
      },
      quote: str,
    }),
  },
});
export function verifySourceTypes(result, pages) {
  return Object.fromEntries(
    pages.map((p) => {
      const candidate = result.sources?.find((s) => s.url === p.url),
        valid =
          candidate &&
          candidate.quote.length >= 15 &&
          evidenceText(p.text).includes(evidenceText(candidate.quote));
      return [
        p.url,
        {
          title: p.title,
          contentType: valid ? candidate.contentType : "Unclassified",
          excerpt: valid ? candidate.quote : "",
          status: valid ? "classified" : "unclassified",
          at: new Date().toISOString(),
          method: "AI format classification from read page excerpt",
        },
      ];
    }),
  );
}
