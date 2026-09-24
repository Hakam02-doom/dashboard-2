import {evidenceText,namedEvidence} from './evidence-normalization.mjs';
// Only explicit ranks count. Table row order and casual mentions are not rankings.
export function answerPosition(answer,identifiers){
 const hits=[];let rankColumn=-1,brandColumn=-1;
 const startsBrand=value=>identifiers.some(name=>{const text=evidenceText(value),brand=evidenceText(name);return text===brand||text.startsWith(brand+' ')||text.startsWith(brand+' —')||text.startsWith(brand+':');});
 for(const line of String(answer||'').split('\n')){
  const clean=line.replace(/^\s*#{1,6}\s*/,'').replace(/\*\*|__/g,'').trim();
  const numbered=clean.match(/^(?:#\s*)?(\d{1,3})[.)]\s+(.+)/);
  if(numbered&&startsBrand(numbered[2]))hits.push({position:Number(numbered[1]),evidence:line});
  if(!clean.startsWith('|')){rankColumn=brandColumn=-1;continue;}
  const cells=clean.split('|').slice(1,-1).map(s=>s.trim());
  const rank=cells.findIndex(c=>/^(rank|ranking|position|#)$/i.test(c));
  const brand=cells.findIndex(c=>/^(brand|business|company|platform|tool|provider|product)$/i.test(c));
  if(rank>=0&&brand>=0){rankColumn=rank;brandColumn=brand;continue;}
  if(rankColumn>=0&&/^#?\d{1,3}$/.test(cells[rankColumn]||'')&&identifiers.some(n=>namedEvidence(cells[brandColumn]||'',n)))hits.push({position:Number(cells[rankColumn].replace('#','')),evidence:line});
 }
 const valid=hits.filter(h=>h.position>0&&h.position<=100);
 return valid.length&&new Set(valid.map(h=>h.position)).size===1?valid[0]:null;
}
export function refreshPositions(row,own){
 if(!row.brandAssessment)return row;
 const metrics=Object.fromEntries(Object.entries(row.brandAssessment).map(([name,m])=>{const rank=answerPosition(row.answer,[name,...(row.measurementProfile?.aliases?.[name]||[])]);return [name,{...m,position:rank?.position??null,positionEvidence:rank?.evidence||''}];}));
 return {...row,position:metrics[own]?.position??null,brandAssessment:metrics,competitorMetrics:{...row.competitorMetrics,...metrics}};
}
