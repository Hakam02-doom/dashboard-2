import { knownBrandByName } from './brand-identities.js';

// Use verified identity aliases or collected website evidence; never invent name.com domains.
export function publicDomain(value) {
 try {
  const u=new URL(value.includes('://')?value:`https://${value}`);
  const host=u.hostname.toLowerCase().replace(/^www\./,'');
  return /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(host)&&!host.endsWith('.local')&&!host.endsWith('.localhost')&&!host.endsWith('.example') ? host : '';
 } catch {return '';}
}
const compact=value=>value.toLowerCase().replace(/[^a-z0-9]/g,'');
export function resolveBrandDomain(name, sources=[], suggestions=[]) {
 const known=knownBrandByName(name);
 if(known)return known.domain;
 // A domain used as the brand's name is already an explicit identity, not a guess.
 const namedDomain=publicDomain(name);
 if(namedDomain)return namedDomain;
 const domains=[...new Set(sources.map(publicDomain).filter(Boolean))];
 const suggested=publicDomain(suggestions.find(s=>s.name===name)?.domain||'');
 if(suggested&&domains.includes(suggested))return suggested;
 const names=[compact(name),...name.split(/[\s/]+/).map(compact)].filter(n=>n.length>=3);
 return domains.find(domain=>names.includes(compact(domain))||domain.split('.').slice(0,-1).some(part=>names.includes(compact(part))))||'';
}
