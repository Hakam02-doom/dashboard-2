import {normalizePrompt} from './ai-prompt-data.js';
import {reportMetrics} from './ai-insights-data.js';
export function promptAnswers(prompt,answers,days=30,now=new Date()){
 const cutoff=days===0?0:now.getTime()-days*86400000;
 return answers.filter(a=>normalizePrompt(a.prompt)===normalizePrompt(prompt.text)&&new Date(a.at).getTime()>=cutoff&&new Date(a.at).getTime()<=now.getTime()).sort((a,b)=>new Date(b.at)-new Date(a.at));
}
export function promptMetrics(prompt,answers,business,days=30){
 const history=promptAnswers(prompt,answers,days);
 const own=reportMetrics(history,business.name).find(b=>b.own);
 return {...own,history,latest:history[0],brands:[...new Set(history.flatMap(a=>[...(a.mentioned?[business.name]:[]),...(a.competitors||[])]))]};
}
export function citationDomains(answers){
 const counts=new Map();
 for(const a of answers){const domains=new Set((a.sources||[]).flatMap(s=>{try{return [new URL(s).hostname.replace(/^www\./,'')];}catch{return [];}}));for(const d of domains)counts.set(d,(counts.get(d)||0)+1);}
 return [...counts].map(([domain,count])=>({domain,count,percent:count/answers.length*100})).sort((a,b)=>b.count-a.count);
}
export function promptReportCsv(rows,metrics){
 const quote=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
 const headers=['Prompt','Topic','Type','Status','Visibility %','Avg position','Sentiment','Visibility rank','Citation share %','Citation rank','Volume','Difficulty','Mentions','Location','Page coverage','Intent','Created','Tracked','Answers','Last collected','Keyword source','Keyword date','Keyword location'];
 return [headers,...rows.map(p=>{const m=metrics(p),k=p.keywordData;return [p.text,(p.topics||[p.topic]).join('; '),p.type,p.status==='archived'?'Archived':p.tracking?'Active':'Proposed',m.visibility,m.position,m.sentiment,m.visibilityRank,m.citationShare,m.citationRank,k?.volume,k?.difficulty,(m.brands||[]).join('; '),m.latest?.location,p.coverage?.status,p.intent||'Custom',p.createdAt,p.trackedAt||m.history.at(-1)?.at,m.history.length,m.latest?.at,k?.source,k?.measuredAt,k?.location];})].map(row=>row.map(quote).join(',')).join('\r\n');
}

export function mergeCollectedPrompts(saved,questions,answers){
 const seen=new Set(saved.map(p=>normalizePrompt(p.text)));
 const imported=[];
 for(const a of answers){const key=normalizePrompt(a.prompt);if(seen.has(key))continue;seen.add(key);const q=questions.find(q=>normalizePrompt(q.text)===key);imported.push({id:`collected-${a.id}`,text:a.prompt,topic:(q?.topic||a.topic||'General').slice(0,80),type:a.type||'Unbranded',intent:q?.intent||'Custom',status:'saved',tracking:true,trackedAt:a.at,virtual:true});}
 const proposed=questions.filter(q=>!seen.has(normalizePrompt(q.text))).map(q=>({...q,id:`proposed-${q.id}`,topic:q.topic.slice(0,80),type:q.type||'Unbranded',status:'saved',tracking:false,virtual:true}));
 return [...saved,...imported,...proposed];
}
export function groupPromptMetrics(prompts,answers,business,days){
 const chosen=new Set(prompts.map(p=>normalizePrompt(p.text)));
 const filtered=answers.filter(a=>chosen.has(normalizePrompt(a.prompt)));
 const recent=filtered.filter(a=>days===0||new Date(a.at)>=new Date(Date.now()-days*86400000)&&new Date(a.at)<=new Date());
 return reportMetrics(recent,business.name).find(b=>b.own);
}
