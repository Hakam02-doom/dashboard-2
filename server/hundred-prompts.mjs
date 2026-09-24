import {asksForOptions} from './ai-analysis.mjs';
import {namedEvidence,ambiguousBrandName} from './evidence-normalization.mjs';
export const BUYER_INTENTS=['Discovery','Comparison','Buying decisions','Use cases'];
export const PROMPT_TARGET=40;
export const PROMPTS_PER_INTENT=PROMPT_TARGET/BUYER_INTENTS.length;
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function nextPromptBatch(questions=[]){
 for(const intent of BUYER_INTENTS){const count=questions.filter(q=>q.intent===intent).length;if(count<PROMPTS_PER_INTENT)return {intent,count:PROMPTS_PER_INTENT-count};}
 return null;
}
export function appendPromptBatch(plan,batch,expected,names=[]){
 const prior=plan?.questions||[],used=new Set(prior.map(q=>normalize(q.text)));
 if(!Array.isArray(batch?.questions)||batch.questions.length<expected.count)throw Error('OpenAI returned an incomplete buyer-question plan.');
 const questions=[];
 for(const q of batch.questions){
  if(typeof q.text!=='string'||q.text.length<20||q.text.length>400||!asksForOptions(q.text)||q.intent!==expected.intent||typeof q.topic!=='string'||!q.topic.trim()||q.topic.length>100)continue;
  const key=normalize(q.text);
  if(used.has(key)||names.filter(n=>!ambiguousBrandName(n)).some(n=>namedEvidence(q.text,n)))continue;
  used.add(key);questions.push(q);
  if(questions.length===expected.count)break;
 }
 if(questions.length!==expected.count)throw Error('OpenAI returned invalid, repeated or branded buyer questions.');
 return {...plan,questions:[...prior,...questions.map((q,i)=>({...q,id:`expanded-${prior.length+i+1}`}))],target:PROMPT_TARGET,createdAt:plan?.createdAt||new Date().toISOString()};
}
