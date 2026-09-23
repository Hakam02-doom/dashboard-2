import {readJsonBody} from '../../server/request-body.mjs';
import {createRuntime,verifiedOwner,internalRequest} from '../../server/cloud-runtime.mjs';
import {analyzeWebsite,websiteUrl} from '../../server/website-analysis.mjs';
const runtime=createRuntime(process.env);
export const config={maxDuration:60};
export default async function(req,res){
 const send=(code,body)=>{res.statusCode=code;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
 if(req.method!=='POST')return send(405,{error:'Use POST.'});
 if(req.headers.origin!=='https://dashboard-2-sandy.vercel.app')return send(403,{error:'Open Dashboard 2.'});
 let lease;
 try{
  if(!runtime.client)return send(503,{error:'Cloud storage is not configured.'});
  await verifiedOwner(req,runtime.client);
  const url=websiteUrl((await readJsonBody(req,4096)).url).href;
  lease=await runtime.store.acquire();if(!lease)return send(429,{error:'Another analysis is running. Try again shortly.'});
  const state=await runtime.store.load(),day=new Date().toISOString().slice(0,10),cached=state.websiteProfiles?.[url];
  if(cached&&Date.parse(cached.analyzedAt)>Date.now()-86400000)return send(200,{profile:cached});
  state.websiteReads ||= {};if((state.websiteReads[day]||0)>=30)return send(429,{error:'Daily website-read limit reached.'});
  state.websiteReads[day]=(state.websiteReads[day]||0)+1;await runtime.store.save(state,lease);
  const profile=await analyzeWebsite(url);state.websiteProfiles={...state.websiteProfiles,[url]:profile};await runtime.store.save(state,lease);return send(200,{profile});
 }catch(e){return send(422,{error:/^(Sign in|Your session|This account|Enter|Use|This|The website)/.test(e.message)?e.message:'Website analysis failed. Try again or enter details manually.'});}finally{if(lease)await runtime.store.release(lease);}
}
