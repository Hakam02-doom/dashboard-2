import {ambiguousBrandName} from './evidence-normalization.mjs';
const compact = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const regionalSuffixes = new Set(['in', 'india', 'uk', 'unitedkingdom', 'us', 'usa', 'unitedstates', 'au', 'australia', 'ca', 'canada', 'de', 'germany', 'fr', 'france', 'jp', 'japan', 'sg', 'singapore', 'nz', 'newzealand', 'global', 'official']);
const legalSuffixes = new Set(['limited','ltd','inc','incorporated','llc','corp','corporation','company']);
const ambiguousLabels = new Set(['app', 'get', 'my', 'the', 'web', 'www', 'shop', 'store', 'online']);

export function domainBrandLabel(domain) {
 const parts = String(domain || '').toLowerCase().replace(/^www\./, '').split('.');
 if (parts.length < 2) return '';
 const countrySuffix = parts.length >= 3 && parts.at(-1).length === 2 && ['co', 'com', 'net', 'org'].includes(parts.at(-2));
 return parts.at(countrySuffix ? -3 : -2) || '';
}

// A regional site title such as "adidas IN" identifies the same brand as
// adidas.co.in. This is only a suggestion grounded in the supplied domain.
export function regionalBrandAlias(name, domain) {
 const label = domainBrandLabel(domain);
 if (label.length < 3 || ambiguousLabels.has(label)) return '';
 const words = String(name || '').trim().split(/\s+/);
 if (words.length < 2) return '';
 for(let count=1;count<=Math.min(2,words.length-1);count++){
  const suffix=compact(words.slice(-count).join(' '));
  const base=words.slice(0,-count).join(' ');
  if((regionalSuffixes.has(suffix)||legalSuffixes.has(suffix))&&compact(base)===compact(label))return base;
 }
 return '';
}

export function canonicalPageTitleName(name, domain) {
 const prefix=String(name||'').split(/\s+[|–—-]\s+/)[0].trim();
 const label=domainBrandLabel(domain);
 if(prefix!==name&&label.length>=3&&compact(prefix)===compact(label))return prefix;
 return name;
}

export function canonicalWebsiteName(name, domain) {
 return regionalBrandAlias(name,domain)||canonicalPageTitleName(name,domain);
}

export function assessmentAliases(business, profile = null, competitors = []) {
 const aliases = Object.fromEntries(Object.entries(profile?.aliases || {}).map(([name, values]) => [name, [...values]]));
 const suggested = regionalBrandAlias(business.name, business.domain);
 if (suggested && !competitors.some(name => compact(name) === compact(suggested))) {
  const own = aliases[business.name] || [];
  if (!own.some(value => compact(value) === compact(suggested))) aliases[business.name] = [...own, suggested];
 }
 return aliases;
}

export function needsIdentityReview(answer, business, aliases) {
 if (answer.assessmentPending) return true;
 if (!answer.brandAssessment) return false;
 if ((answer.measurementVersion || 0) < 3 && [business.name,...(answer.trackedCompetitors||[])].some(ambiguousBrandName)) return true;
 if (!Object.hasOwn(answer.brandAssessment, business.name)) return true;
 const required = aliases[business.name] || [];
 const applied = answer.assessmentAliases?.[business.name] || [];
 return required.some(alias => !applied.some(value => compact(value) === compact(alias)));
}
