export const BUSINESS_KEY = 'd2-ai-businesses-v1';
export const businessStorageKey = userId => `${BUSINESS_KEY}:${userId}`;
export function publicWebsite(value) {
  const url = new URL(value.includes('://') ? value.trim() : `https://${value.trim()}`);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !url.hostname.includes('.') || /^\d[\d.]*$/.test(url.hostname) || url.hostname.includes(':') || /\.(local|localhost|internal|test|invalid)$/i.test(url.hostname)) throw new Error('Enter a public HTTPS website, such as example.com.');
  url.search = ''; url.hash = ''; return url;
}
export function validBusiness(profile) {
  if (!profile || typeof profile.name !== 'string' || !profile.name.trim() || profile.name.length > 100 || typeof profile.description !== 'string' || profile.description.length > 600 || !Array.isArray(profile.headings) || profile.headings.some(h => typeof h !== 'string') || !Array.isArray(profile.schemaTypes)) return false;
  try { return publicWebsite(profile.url).hostname.replace(/^www\./, '') === profile.domain; } catch { return false; }
}
export function businessSuggestions(profile) {
  return [
    [`What does ${profile.name} offer?`, 'Brand awareness', 'Branded'],
    [`Who is ${profile.name} best suited for?`, 'Buying decisions', 'Branded'],
    [`What are the alternatives to ${profile.name}?`, 'Comparison', 'Branded'],
    [`What should I consider when choosing a business like ${profile.name}?`, 'Buying decisions', 'Branded'],
  ].map(([text, topic, type], i) => ({ id: `business-starter-${i}`, text, topic, type }));
}
