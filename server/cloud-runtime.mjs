import {readJsonBody} from './request-body.mjs';
import {directConfig,directStatus} from './direct-collectors.mjs';
import {createGoogleTraffic} from './google-traffic.mjs';
import {createClient} from '@supabase/supabase-js';
import {Readable} from 'node:stream';
import {timingSafeEqual} from 'node:crypto';
import {cloudCollectorStore,localCollectorStore} from './collector-store.mjs';
import {searchapiHandler} from './searchapi-handler.mjs';
const localOrigins=['http://127.0.0.1:5174','http://localhost:5174'];
export function serverClient(env){const url=env.VITE_SUPABASE_URL||env.SUPABASE_URL,key=env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;}
export async function verifiedOwner(req,client){
 const token=String(req.headers.authorization||'').replace(/^Bearer /,'');if(!token)throw Error('Sign in to AI Visibility to access cloud monitoring.');
 const {data,error}=await client.auth.getUser(token);if(error||!data.user)throw Error('Your session expired. Sign in again.');
 const {data:row,error:readError}=await client.from('ai_collector_store').select('owner_id').eq('id',true).single();
 if(readError||row.owner_id!==data.user.id)throw Error('This account is not the Dashboard 2 monitoring owner. Connect your account from the local dashboard first.');return data.user;
}
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
export function internalRequest(body){const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={origin:localOrigins[0],host:'127.0.0.1:5174','content-type':'application/json'};return req;}
export function createRuntime(env,{local=false,directory='.local-ai'}={}){
 const client=serverClient(env),store=client?cloudCollectorStore(client):localCollectorStore(directory);
 const direct=directConfig(env);
 const googleTraffic=createGoogleTraffic(env);
 const collector=searchapiHandler({direct,googleTraffic,local:true,key:env.SEARCHAPI_API_KEY,analysisKey:env.OPENAI_API_KEY,analysisBudget:Number(env.AI_ANALYSIS_BUDGET_USD||1),store});
 const tick=async()=>{const state=await store.load();if(!Object.values(state.schedules||{}).some(s=>s.enabled))return {idle:true};const req=internalRequest({action:'scheduleTick',business:{name:'Scheduler',domain:'worker.example'}});req.internalWorker=true;let result;await collector(req,{setHeader(){},end(body){result={status:this.statusCode,...JSON.parse(body)};}});return result;};
 const runCollector=async(req,res)=>{const headers={};let status,body;await collector(req,{setHeader(k,v){headers[k]=v;},set statusCode(v){status=v;},get statusCode(){return status;},end(v){body=v;}});res.statusCode=status;for(const [k,v]of Object.entries(headers))res.setHeader(k,v);res.end(body);};
 return {client,store,tick,async handler(req,res){
  if(local)return runCollector(req,res);
  if(!client)return send(res,503,{error:'Cloud storage is not configured.'});
  if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
  if(req.headers.origin!=='https://dashboard-2-sandy.vercel.app')return send(res,403,{error:'Open Dashboard 2 to use monitoring.'});
  try{await verifiedOwner(req,client);}catch(e){return send(res,401,{error:e.message});}
  let body;try{body=await readJsonBody(req);}catch(e){return send(res,e.message==='Request too large.'?413:400,{error:e.message});}
  return runCollector(internalRequest(body),res);
 },async connections(req,res){
  if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
  const origin=req.headers.origin;if(!(local?localOrigins.includes(origin)&&['127.0.0.1:5174','localhost:5174'].includes(req.headers.host):origin==='https://dashboard-2-sandy.vercel.app'))return send(res,403,{error:'Open Dashboard 2.'});
  let body;try{body=await readJsonBody(req,4096);}catch(e){return send(res,e.message==='Request too large.'?413:400,{error:e.message});}
  if(body.action==='status'){let reachable=false,linked=false;try{if(client){const {data,error}=await client.from('ai_collector_store').select('owner_id').eq('id',true).single();reachable=!error;linked=!!data?.owner_id;}}catch{}return send(res,200,{directCollectors:directStatus(direct),googleTrafficConfigured:googleTraffic.configured,googleServiceAccount:googleTraffic.serviceAccount,storage:store.kind,cloudConfigured:!!client,cloudReachable:reachable,ownerLinked:linked,searchConfigured:!!env.SEARCHAPI_API_KEY,analysisConfigured:!!env.OPENAI_API_KEY,budget:Math.min(15,Number(env.AI_ANALYSIS_BUDGET_USD||1)),scheduling:true,keywordMode:'csv'});}
  if(body.action==='claim'&&client){
   if(!local){try{await verifiedOwner(req,client);return send(res,200,{connected:true});}catch(e){return send(res,401,{error:e.message});}}
   const token=String(req.headers.authorization||'').replace(/^Bearer /,'');const {data,error}=await client.auth.getUser(token);if(error||!data.user)return send(res,401,{error:'Sign in before connecting your monitoring account.'});
   const {data:rows,error:claimError}=await client.from('ai_collector_store').update({owner_id:data.user.id}).eq('id',true).is('owner_id',null).select('owner_id');
   if(claimError)return send(res,500,{error:'Could not connect the account.'});
   if(!rows.length){try{await verifiedOwner(req,client);}catch{return send(res,409,{error:'A different account already owns monitoring.'});}}
   return send(res,200,{connected:true});
  }return send(res,400,{error:'Unknown connection action.'});
 },async cron(req,res){
  const expected=env.AI_CRON_SECRET,provided=String(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!expected||provided.length!==expected.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(provided)))return send(res,401,{error:'Unauthorized worker.'});
  try{send(res,200,await tick());}catch{return send(res,500,{error:'Worker failed. Saved job state retained.'});}
 }};
}
