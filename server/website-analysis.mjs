import https from 'node:https';
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { load } from 'cheerio';

export function websiteUrl(input) {
  if (typeof input !== 'string' || input.length > 2048) throw new Error('Enter a public business website.');
  let url;
  try { url = new URL(input.includes('://') ? input.trim() : `https://${input.trim()}`); } catch { throw new Error('Enter a valid website, such as example.com.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !url.hostname.includes('.') || ipaddr.isValid(url.hostname.replace(/^\[|\]$/g, '')) || /\.(localhost|local|internal|test|invalid)$/i.test(url.hostname)) throw new Error('Use a public HTTPS website with no login details or custom port.');
  url.hash = ''; url.search = '';
  return url;
}
export function isPublicAddress(address) {
  try { return ipaddr.parse(address).range() === 'unicast'; } catch { return false; }
}
async function resolvePublic(hostname) {
  let timer;
  try {
    const addresses = await Promise.race([lookup(hostname, { family: 4, all: true }), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('This website took too long to resolve.')), 3000); })]);
    if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new Error('This address is not a public website.');
    return addresses[0];
  } finally { clearTimeout(timer); }
}
export async function fetchWebsite(input, remaining = 3) {
  const url = websiteUrl(input);
  const address = await resolvePublic(url.hostname);
  const result = await new Promise((resolve, reject) => {
    const request = https.get(url, {
      agent: false,
      headers: { 'User-Agent': 'Dashboard2BusinessReader/1.0', Accept: 'text/html,application/xhtml+xml', 'Accept-Encoding': 'identity' },
      // Pin the validated address to this connection; do not resolve again during the request.
      lookup: (_hostname, options, callback) => options.all ? callback(null, [address]) : callback(null, address.address, address.family),
    }, response => {
      const status = response.statusCode;
      if ([301, 302, 303, 307, 308].includes(status)) { response.resume(); resolve({ redirect: response.headers.location }); return; }
      if (status < 200 || status >= 300) { response.resume(); reject(new Error(`The website returned HTTP ${status}. Try its public home page or enter the business details manually.`)); return; }
      if (!/text\/html|application\/xhtml\+xml/i.test(response.headers['content-type'] || '')) { response.resume(); reject(new Error('That link is not a web page. Use the business website.')); return; }
      let bytes = 0; const chunks = [];
      response.on('data', chunk => { bytes += chunk.length; if (bytes > 2_000_000) request.destroy(new Error('This page is too large. Try a simpler public page.')); else chunks.push(chunk); });
      response.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8'), url: url.href }));
      response.on('error', reject);
    });
    const timer = setTimeout(() => request.destroy(new Error('The website took too long to respond. Try again or enter details manually.')), 6000);
    request.on('close', () => clearTimeout(timer)); request.on('error', reject);
  });
  if ('redirect' in result) {
    if (!remaining || !result.redirect) throw new Error('This website redirects too many times. Use its final public address.');
    return fetchWebsite(new URL(result.redirect, url).href, remaining - 1);
  }
  return result;
}
export function extractBusiness(html, sourceUrl, now = new Date()) {
  const $ = load(html);
  $('script:not([type="application/ld+json"]),style,noscript,svg,nav,footer').remove();
  const text = value => String(value || '').replace(/\s+/g, ' ').trim();
  const title = text($('title').first().text()).slice(0, 200);
  const description = text($('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content')).slice(0, 600);
  const headings = [...new Set($('h1,h2').map((_, el) => text($(el).text())).get().filter(Boolean))].slice(0, 12).map(v => v.slice(0, 160));
  const schemaTypes = new Set(); let organization = '';
  function visit(value, depth = 0) {
    if (!value || typeof value !== 'object' || depth > 6) return;
    if (Array.isArray(value)) { value.slice(0, 100).forEach(v => visit(v, depth + 1)); return; }
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    types.filter(t => typeof t === 'string').forEach(t => schemaTypes.add(t.slice(0, 80)));
    if (!organization && types.some(t => ['Organization', 'LocalBusiness', 'Corporation'].includes(t)) && typeof value.name === 'string') organization = text(value.name);
    if (value['@graph']) visit(value['@graph'], depth + 1);
  }
  $('script[type="application/ld+json"]').slice(0, 20).each((_, el) => { try { visit(JSON.parse($(el).text())); } catch { /* A malformed block is not evidence. */ } });
  $('script').remove();
  const url = new URL(sourceUrl);
  const name = text(organization || $('meta[property="og:site_name"]').attr('content') || title.split(/\s[|–—]\s/)[0] || url.hostname).slice(0, 100);
  const body = text($('body').text());
  return { domain: url.hostname.replace(/^www\./, ''), url: url.href, name, description: description || text($('main p,p').first().text()).slice(0, 600), headings, schemaTypes: [...schemaTypes].slice(0, 20), title, analyzedAt: now.toISOString(), source: 'website', wordCount: body ? body.split(/\s+/).length : 0, language: text($('html').attr('lang')).slice(0, 20), scope: 'Submitted page only; no JavaScript rendering or AI-answer collection.' };
}
export async function analyzeWebsite(input) {
  const page = await fetchWebsite(input);
  const profile=extractBusiness(page.html,page.url);
  const $=load(page.html), origin=new URL(page.url).origin;
  const links=[...new Set($('a[href]').map((_,el)=>{try{const u=websiteUrl(new URL($(el).attr('href'),page.url).href);return u.origin===origin&&/\/(about|features|solutions|products|pricing|services)(\/|$|-)/i.test(u.pathname)?u.href:null;}catch{return null;}}).get().filter(Boolean))].slice(0,3);
  const pages=await Promise.allSettled(links.map(async url=>{const p=await fetchWebsite(url);if(new URL(p.url).origin!==origin)throw Error('Off-site redirect');const info=extractBusiness(p.html,p.url);return {url:p.url,title:info.title,description:info.description,headings:info.headings};}));
  profile.pages=[{url:page.url,title:profile.title,description:profile.description,headings:profile.headings},...pages.filter(p=>p.status==='fulfilled').map(p=>p.value)];
  profile.scope=`${profile.pages.length} public pages read; no JavaScript rendering. Unread pages are not evidence.`;
  return profile;
}
