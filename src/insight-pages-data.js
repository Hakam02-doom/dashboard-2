import { reportMetrics } from "./ai-insights-data.js";
export const pct = (v) => (Number.isFinite(v) ? `${v.toFixed(1)}%` : "—");
export const norm = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
export const unique = (a) => [...new Set(a)];
export function brandRows(rows, brand, own) {
  return rows.map((r) => {
    if (brand === own) return r;
    const m = r.brandAssessment?.[brand] || r.competitorMetrics?.[brand];
    return {
      ...r,
      mentioned: r.competitors?.includes(brand) || false,
      cited: null,
      position: m?.position ?? null,
      sentiment: m?.sentiment || "Not assessed",
    };
  });
}
export function bucketRows(rows, cadence = "Daily") {
  const map = new Map();
  for (const r of rows) {
    const d = new Date(r.at);
    if (!Number.isFinite(+d)) continue;
    if (cadence === "Weekly")
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const key = d.toISOString().slice(0, 10);
    map.set(key, [...(map.get(key) || []), r]);
  }
  return [...map].sort(([a], [b]) => a.localeCompare(b));
}
export function sentimentData(rows) {
  const values = rows.filter(
    (r) =>
      r.mentioned && ["Positive", "Neutral", "Negative"].includes(r.sentiment),
  );
  const counts = ["Positive", "Neutral", "Negative"].map(
    (label) => values.filter((r) => r.sentiment === label).length,
  );
  return {
    count: values.length,
    counts,
    score: values.length
      ? (counts[0] * 100 + counts[1] * 50) / values.length
      : null,
  };
}
export function domainOf(url) {
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) ? u.hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
}
export function sourceRows(rows, domain, prior = []) {
  const map = new Map();
  for (const row of rows)
    for (const url of unique(row.sources || [])) {
      const host = domainOf(url);
      if (!host) continue;
      let item = map.get(url);
      if (!item) {
        item = {
          url,
          domain: host,
          rows: [],
          type:
            host === domain || host.endsWith("." + domain)
              ? "Owned"
              : /^(www\.)?(youtube.com|youtu.be|reddit.com|linkedin.com|facebook.com|instagram.com|tiktok.com|x.com)$/.test(
                    host,
                  )
                ? "Social"
                : "Third-party",
          contentType: row.sourceMetadata?.[url]?.contentType || "Unclassified",
          metadata: row.sourceMetadata?.[url] || null,
        };
        map.set(url, item);
      }
      item.rows.push(row);
    }
  return [...map.values()]
    .map((s) => {
      const before = prior.filter((r) => r.sources?.includes(s.url)).length;
      return {
        ...s,
        count: s.rows.length,
        used: rows.length ? (s.rows.length / rows.length) * 100 : null,
        growth: prior.length
          ? (s.rows.length / Math.max(1, rows.length)) * 100 -
            (before / prior.length) * 100
          : null,
      };
    })
    .sort((a, b) => b.count - a.count);
}
export function topicRows(rows, own) {
  return unique(rows.map((r) => r.topic || "Unclassified")).map((name) => {
    const answers = rows.filter((r) => (r.topic || "Unclassified") === name),
      rankings = reportMetrics(answers, own);
    return {
      name,
      rows: answers,
      prompts: unique(answers.map((r) => norm(r.prompt))).length,
      rankings,
      own: rankings.find((r) => r.own),
    };
  });
}
export function fanoutRows(rows, library = []) {
  const active = new Set(
      library
        .filter((p) => p.tracking && p.status !== "archived")
        .map((p) => norm(p.text)),
    ),
    map = new Map();
  for (const row of rows) {
    const key = norm(row.prompt);
    if (!map.has(key))
      map.set(key, { prompt: row.prompt, rows: [], queries: new Map() });
    const item = map.get(key);
    item.rows.push(row);
    for (const query of row.fanout || []) {
      if (typeof query !== "string" || !norm(query)) continue;
      const k = norm(query);
      const q = item.queries.get(k) || {
        text: query,
        count: 0,
        tracked: active.has(k),
      };
      q.count++;
      item.queries.set(k, q);
    }
  }
  return [...map.values()].map((item) => ({
    ...item,
    queries: [...item.queries.values()],
    count: item.queries.size,
    coverage: item.queries.size
      ? ([...item.queries.values()].filter((q) => q.tracked).length /
          item.queries.size) *
        100
      : null,
  }));
}
