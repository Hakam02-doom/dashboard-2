export const evidenceText=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/https?:\/\/[^\s)]+/g,'').replace(/[*_`#]/g,'').replace(/\s+/g,' ').trim();
export function namedEvidence(answer,name){
 const normalize=value=>evidenceText(value).replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 return (' '+normalize(answer)+' ').includes(' '+normalize(name)+' ');
}
