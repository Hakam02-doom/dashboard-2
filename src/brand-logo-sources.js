import { publicDomain, resolveBrandDomain } from './brand-domains.js';
import { knownBrandIdentity } from './brand-identities.js';

export function brandLogoSources(name, domain) {
  const host = publicDomain(domain || '') || resolveBrandDomain(name);
  const identity = knownBrandIdentity(name, host);
  return [...new Set([
    identity?.asset ? `/brands/${identity.asset}` : '',
    host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : '',
    host ? `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico` : '',
  ].filter(Boolean))];
}
