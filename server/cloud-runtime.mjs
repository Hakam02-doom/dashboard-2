import {readJsonBody} from './request-body.mjs';
import {directConfig,directStatus} from './direct-collectors.mjs';
import {createGoogleTraffic} from './google-traffic.mjs';
import {createClient} from '@supabase/supabase-js';
import {Readable} from 'node:stream';
import {timingSafeEqual} from 'node:crypto';
import {cloudCollectorStore,cloudBudgetStore,localCollectorStore} from './collector-store.mjs';
import {searchapiHandler} from './searchapi-handler.mjs';
const localOrigins=['http://127.0.0.1:5174','http://localhost:5174'];
export function serverClient(env){const url=env.VITE_SUPABASE_URL||env.SUPABASE_URL,key=env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(url,options={})=>fetch(url,{...options,signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)})}}):null;}
function unavailable(){const error=new Error('The monitoring service is temporarily unavailable. Please try again shortly.');error.status=503;return error;}
async function authUser(client,token){
 let timer;
 try{return await Promise.race([client.auth.getUser(token),new Promise((_,reject)=>{timer=setTimeout(()=>reject(unavailable()),25000);})]);}
 finally{clearTimeout(timer);}
}
export async function verifiedUser(req,client){
 const token=String(req.headers.authorization||'').replace(/^Bearer /,'');if(!token)throw Error('Your workspace is not ready. Refresh the page to reconnect.');
 let result;try{result=await authUser(client,token);}catch{throw unavailable();}
 const {data,error}=result;
 if(error&&(error.status>=500||error.status===0||error.name==='AuthRetryableFetchError'||/fetch failed|network|timed? out|gateway/i.test(error.message||'')))throw unavailable();
 if(error||!data?.user)throw Error('Your session expired. Refresh the page to reconnect.');
 return data.user;
}
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
const transientStoreError=error=>error&&(error.status>=500||error.status===0||/timeout|timed? out|fetch failed|gateway/i.test(error.message||''));
export async function claimWorkspace(client,accountId){
 let result;
 for(let attempt=0;attempt<2;attempt++){
  result=await client.rpc('ai_workspace_claim',{account_id:accountId}).abortSignal(AbortSignal.timeout(14000));
  if(!transientStoreError(result.error)||attempt===1)break;
  await new Promise(resolve=>setTimeout(resolve,700));
 }
 return result;
}
export function internalRequest(body){const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={origin:localOrigins[0],host:'127.0.0.1:5174','content-type':'application/json'};return req;}
export function createRuntime(env,{local=false,directory='.local-ai'}={}){
 const client=serverClient(env),localStore=localCollectorStore(directory),budgetStore=client?cloudBudgetStore(client):null;
 const direct=directConfig(env);
 const googleTraffic=createGoogleTraffic(env);
 const collectorFor=ownerId=>searchapiHandler({direct,googleTraffic,local:true,key:env.SEARCHAPI_API_KEY,analysisKey:env.OPENAI_API_KEY,analysisBudget:Number(env.AI_ANALYSIS_BUDGET_USD||1),store:client?cloudCollectorStore(client,ownerId):localStore,budgetStore});
 const tick=async()=>{
  let owners=[null];
  if(client){const {data,error}=await client.rpc('ai_scheduled_owners').abortSignal(AbortSignal.timeout(10000));if(error)throw Error('Could not load scheduled workspaces.');owners=data;}
  for(const ownerId of owners){if(!client){const state=await localStore.load();if(!Object.values(state.schedules||{}).some(s=>s.enabled))continue;}
   const req=internalRequest({action:'scheduleTick',business:{name:'Scheduler',domain:'worker.example'}});req.internalWorker=true;let result;
   await collectorFor(ownerId)(req,{setHeader(){},end(body){result={status:this.statusCode,...JSON.parse(body)};}});if(result&&!result.idle)return result;
  }return {idle:true};
 };
 const runCollector=async(req,res,ownerId)=>{const headers={};let status,body;await collectorFor(ownerId)(req,{setHeader(k,v){headers[k]=v;},set statusCode(v){status=v;},get statusCode(){return status;},end(v){body=v;}});res.statusCode=status;for(const [k,v]of Object.entries(headers))res.setHeader(k,v);res.end(body);};
 return {client,tick,async handler(req,res){
  if(!client)return send(res,503,{error:'Cloud storage is not configured.'});
  if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
  if(local?!(localOrigins.includes(req.headers.origin)&&['127.0.0.1:5174','localhost:5174'].includes(req.headers.host)):req.headers.origin!=='https://dashboard-2-sandy.vercel.app')return send(res,403,{error:'Open Dashboard 2 to use monitoring.'});
  let user;try{user=await verifiedUser(req,client);}catch(e){return send(res,e.status===503?503:401,{error:e.message});}
  let body;try{body=await readJsonBody(req);}catch(e){return send(res,e.message==='Request too large.'?413:400,{error:e.message});}
  const {data:workspace,error}=await client.from('ai_collector_workspaces').select('owner_id').eq('owner_id',user.id).maybeSingle().abortSignal(AbortSignal.timeout(10000));
  if(error)return send(res,503,{error:'Monitoring storage is temporarily unavailable. Please retry shortly.'});
  if(!workspace)return send(res,403,{error:'Your workspace is still being prepared. Please try again.'});
  return runCollector(internalRequest(body),res,user.id);
 },async connections(req,res){
  if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
  const origin=req.headers.origin;if(!(local?localOrigins.includes(origin)&&['127.0.0.1:5174','localhost:5174'].includes(req.headers.host):origin==='https://dashboard-2-sandy.vercel.app'))return send(res,403,{error:'Open Dashboard 2.'});
  let body;try{body=await readJsonBody(req,4096);}catch(e){return send(res,e.message==='Request too large.'?413:400,{error:e.message});}
  if(body.action==='status'){let reachable=false,linked=false;try{if(client){const {data,error}=await client.from('ai_collector_store').select('owner_id').eq('id',true).single().abortSignal(AbortSignal.timeout(10000));reachable=!error;linked=!!data?.owner_id;}}catch{}return send(res,200,{directCollectors:directStatus(direct),googleTrafficConfigured:googleTraffic.configured,googleServiceAccount:googleTraffic.serviceAccount,storage:client?'cloud':localStore.kind,cloudConfigured:!!client,cloudReachable:reachable,ownerLinked:linked,searchConfigured:!!env.SEARCHAPI_API_KEY,analysisConfigured:!!env.OPENAI_API_KEY,budget:Math.min(31,Number(env.AI_ANALYSIS_BUDGET_USD||1)),scheduling:true,keywordMode:'csv'});}
  if(body.action==='claim'&&client){
   let user;try{user=await verifiedUser(req,client);}catch(e){return send(res,e.status===503?503:401,{error:e.message});}
   let result;try{result=await claimWorkspace(client,user.id);}catch{return send(res,503,{error:'Monitoring storage is temporarily unavailable. Your saved results are safe; please try again.'});}
   if(result.error)return send(res,503,{error:'Monitoring storage is temporarily unavailable. Your saved results are safe; please try again.'});
   return send(res,200,{connected:true,legacyOwner:result.data===true});
  }return send(res,400,{error:'Unknown connection action.'});
 },async cron(req,res){
  const expected=env.AI_CRON_SECRET,provided=String(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!expected||provided.length!==expected.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(provided)))return send(res,401,{error:'Unauthorized worker.'});
  try{send(res,200,await tick());}catch{return send(res,500,{error:'Worker failed. Saved job state retained.'});}
 }};
}
