import {asksForOptions} from './ai-analysis.mjs';
import {namedEvidence,ambiguousBrandName} from './evidence-normalization.mjs';
export const BUYER_INTENTS=['Discovery','Comparison','Buying decisions','Use cases'];
export const PROMPT_TARGET=100;
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function nextPromptBatch(questions=[]){
 for(const intent of BUYER_INTENTS){const count=questions.filter(q=>q.intent===intent).length;if(count<25)return {intent,count:25-count};}
 return null;
}
export function appendPromptBatch(plan,batch,expected,names=[]){
 const prior=plan?.questions||[],used=new Set(prior.map(q=>normalize(q.text)));
 if(!Array.isArray(batch?.questions)||batch.questions.length!==expected.count)throw Error('OpenAI returned an incomplete buyer-question plan.');
 for(const q of batch.questions){
  if(typeof q.text!=='string'||q.text.length<20||q.text.length>400||!asksForOptions(q.text)||q.intent!==expected.intent||typeof q.topic!=='string'||!q.topic.trim()||q.topic.length>100)throw Error('OpenAI returned an invalid buyer question.');
  const key=normalize(q.text);
  if(used.has(key)||names.filter(n=>!ambiguousBrandName(n)).some(n=>namedEvidence(q.text,n)))throw Error('OpenAI returned repeated or branded buyer questions.');
  used.add(key);
 }
 return {...plan,questions:[...prior,...batch.questions.map((q,i)=>({...q,id:`expanded-${prior.length+i+1}`}))],target:100,createdAt:plan?.createdAt||new Date().toISOString()};
}
