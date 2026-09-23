/** Supports both raw Node requests and Vercel's parsed request body. */
export async function readJsonBody(req, limit = 1000000) {
 let raw;
 if (req.body !== undefined) raw = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
 else { raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > limit) throw Error('Request too large.'); } }
 if (Buffer.byteLength(raw || '') > limit) throw Error('Request too large.');
 try { return JSON.parse(raw); } catch { throw Error('Invalid request.'); }
}
