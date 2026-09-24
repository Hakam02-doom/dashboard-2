import {randomUUID} from 'node:crypto';

const MODEL = 'gpt-4.1-mini';
const validUrl = value => {
 try { const url=new URL(value); return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null; }
 catch { return null; }
};

export function normalizeOpenAIWebResponse(data, business, prompt, topic='Buyer questions') {
 if(data?.status!=='completed'||!Array.isArray(data.output))throw Error('OpenAI web search did not return a completed answer.');
 const searches=data.output.filter(item=>item.type==='web_search_call'&&item.action?.type==='search');
 const messages=data.output.filter(item=>item.type==='message');
 const answer=messages.flatMap(item=>item.content||[]).filter(item=>item.type==='output_text').map(item=>item.text).join('\n\n').trim();
 if(!searches.length||!answer)throw Error('OpenAI returned no web-grounded answer. This observation was not counted.');
 const sources=[...new Set(messages.flatMap(item=>item.content||[]).flatMap(item=>item.annotations||[]).map(item=>validUrl(item.url)).filter(Boolean))];
 const fanout=[...new Set(searches.flatMap(item=>item.action?.queries||[]).filter(q=>typeof q==='string'))];
 const cost=((data.usage?.input_tokens||0)*0.4+(data.usage?.output_tokens||0)*1.6)/1e6+searches.length*0.01;
 return {answer:{id:data.id||randomUUID(),at:new Date().toISOString(),engine:'OpenAI Web Search',method:`OpenAI ${MODEL} · web search`,prompt,answer,mentioned:null,cited:sources.some(source=>{const host=new URL(source).hostname.replace(/^www\./,'');return host===business.domain||host.endsWith('.'+business.domain);}),position:null,sentiment:'Not assessed',topic,type:'Unbranded',location:'Not specified',sources,fanout,competitors:[],comparisonAssessed:false,webSearchPerformed:true,model:MODEL,assessmentPending:true},cost,searches:searches.length};
}

export async function collectOpenAIWeb({key,business,prompt,topic,request=fetch,reserve}) {
 if(!key)throw Error('OpenAI web search is not configured.');
 await reserve();
 let response;
 try {response=await request('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,store:false,tools:[{type:'web_search',search_context_size:'low'}],tool_choice:'required',input:prompt,max_output_tokens:1300}),signal:AbortSignal.timeout(90000),redirect:'error'});}
 catch {throw Error('OpenAI web search timed out. The attempt was saved and will not be retried automatically.');}
 const data=await response.json();
 if(!response.ok)throw Error(data.error?.code==='insufficient_quota'?'OpenAI has no available API credit.':'OpenAI web search returned '+response.status+'. No automatic retry was made.');
 return normalizeOpenAIWebResponse(data,business,prompt,topic);
}
