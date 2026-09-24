export const evidenceText=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/https?:\/\/[^\s)]+/g,'').replace(/[*_`#]/g,'').replace(/\s+/g,' ').trim();
export const ambiguousBrandName=name=>['on','in','as','at','by','of','to','us','go','up'].includes(String(name).toLowerCase());
export function namedEvidence(answer,name){
 // Short names such as "On" are ordinary words too. Require their brand-like
 // capitalization in the answer instead of matching every lowercase "on".
 if(ambiguousBrandName(name)){
  const escaped=String(name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,'u').test(String(answer).replace(/https?:\/\/[^\s)]+/g,''));
 }
 const normalize=value=>evidenceText(value).replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 return (' '+normalize(answer)+' ').includes(' '+normalize(name)+' ');
}
