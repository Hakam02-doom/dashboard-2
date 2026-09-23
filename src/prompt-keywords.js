import {normalizePrompt} from './ai-prompt-data.js';
// Strict CSV parsing keeps quoted commas/newlines intact and rejects partial imports.
export function parseKeywordCsv(text, now=new Date()) {
 if(text.length>1_000_000)throw Error('Use a CSV smaller than 1 MB.');
 const rows=[];let row=[],field='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else if(!quoted&&field)throw Error('Invalid CSV quoting.');else quoted=!quoted;}else if(!quoted&&(c===','||c==='\n'||c==='\r')){row.push(field);field='';if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(v=>v.trim()))rows.push(row);row=[];}}else field+=c;}
 if(quoted)throw Error('The CSV has an unclosed quoted field.');
 row.push(field);if(row.some(v=>v.trim()))rows.push(row);
 const headers=(rows.shift()||[]).map(s=>s.trim().toLowerCase());
 if(!headers.includes('prompt')||!headers.includes('source'))throw Error('Include Prompt and Source columns, plus Volume and/or Difficulty.');
 if(rows.length>1000||!rows.length)throw Error('Import between 1 and 1,000 rows.');
 const seen=new Set();return rows.map((cells,i)=>{
 const get=k=>(cells[headers.indexOf(k)]||'').trim();const prompt=get('prompt'),source=get('source');
 if(!prompt||prompt.length>500||!source||source.length>200)throw Error(`Row ${i+2}: provide a prompt and data source.`);
 const number=(key,max)=>{const raw=get(key);if(!raw)return null;const n=Number(raw.replaceAll(',',''));if(!Number.isFinite(n)||n<0||n>max||(key==='volume'&&!Number.isInteger(n)))throw Error(`Row ${i+2}: invalid ${key}.`);return n;};
 const volume=number('volume',1e12),difficulty=number('difficulty',100);
 if(volume===null&&difficulty===null)throw Error(`Row ${i+2}: include volume or difficulty.`);
 const measuredAt=get('date');if(measuredAt&&(!/^\d{4}-\d{2}-\d{2}$/.test(measuredAt)||!Number.isFinite(Date.parse(measuredAt))||new Date(measuredAt).toISOString().slice(0,10)!==measuredAt||Date.parse(measuredAt)>now.getTime()))throw Error(`Row ${i+2}: use a valid past date (YYYY-MM-DD).`);
 const key=normalizePrompt(prompt);if(seen.has(key))throw Error(`Row ${i+2}: duplicate prompt.`);seen.add(key);
 return {key,prompt,volume,difficulty,source,location:get('location').slice(0,100),measuredAt:measuredAt||null,importedAt:now.toISOString()};
 });
}
export function promptTrend(answers,businessName,reportMetrics){
 const days=new Map();for(const a of answers){const time=new Date(a.at);if(!Number.isFinite(time.getTime()))continue;const day=time.toISOString().slice(0,10);days.set(day,[...(days.get(day)||[]),a]);}
 return [...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,rows])=>({date,...reportMetrics(rows,businessName).find(b=>b.own),count:rows.length}));
}
