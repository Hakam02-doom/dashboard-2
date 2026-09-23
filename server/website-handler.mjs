import { analyzeWebsite } from './website-analysis.mjs';
let active = 0;
export function websiteHandler({ local = false, analyze = analyzeWebsite } = {}) {
  return async (req, res) => {
    const send = (status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { error: 'Use POST.' }); }
    // Production must get project authentication and durable rate limits before enabling remote fetches.
    if (!local) return send(503, { error: 'Website analysis is available in the local preview. Production authentication is not connected yet. You can enter details manually.' });
    if (req.headers.origin && !['http://127.0.0.1:5174', 'http://localhost:5174'].includes(req.headers.origin)) return send(403, { error: 'Open Dashboard 2 to analyze a website.' });
    if (!String(req.headers['content-type']).startsWith('application/json')) return send(415, { error: 'Send JSON.' });
    if (active >= 3) return send(429, { error: 'Other pages are being read. Please try again shortly.' });
    active++;
    try {
      let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 4096) return send(413, { error: 'The website link is too long.' }); }
      let body; try { body = JSON.parse(raw); } catch { return send(400, { error: 'Enter a valid website.' }); }
      const profile = await analyze(body.url);
      return send(200, { profile });
    } catch (error) {
      const known = /^(Enter|Use |This |The website|That link)/.test(error.message);
      return send(422, { error: known ? error.message : 'We could not read that website. Try its public home page, or enter the business details manually.' });
    } finally { active--; }
  };
}
