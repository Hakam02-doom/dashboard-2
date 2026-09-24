import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {readJsonBody} from './request-body.mjs';
import {serverClient,verifiedUser,internalRequest} from './cloud-runtime.mjs';
import {cloudCollectorStore,cloudBudgetStore} from './collector-store.mjs';
import {websiteUrl,analyzeWebsite} from './website-analysis.mjs';
import {searchWebsiteProfile} from './website-search-fallback.mjs';
import {PROMPT_TARGET} from './hundred-prompts.mjs';
import {searchapiHandler} from './searchapi-handler.mjs';

export const canUseWebsiteFallback=e=>/HTTP (403|429|5\d\d)|took too long to (respond|resolve)|This page is too large/i.test(e?.message||'')||['ECONNRESET','ETIMEDOUT','EAI_AGAIN'].includes(e?.code);
const origin='https://dashboard-2-sandy.vercel.app';
const send=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
export const publicJob=j=>j?({id:j.id,url:j.url,domain:j.domain,status:j.status,stage:j.stage,progress:j.progress,target:j.target||3,profile:j.profile,error:j.error,updatedAt:j.updated_at}):null;
async function rpc(client,name,args={}){const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
export function createJobsApi(env,{client=serverClient(env),local=false}={}){
 return async(req,res)=>{
  if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
  if(!(local?['http://127.0.0.1:5174','http://localhost:5174'].includes(req.headers.origin):req.headers.origin===origin))return send(res,403,{error:'Open Dashboard 2.'});
  if(!client)return send(res,503,{error:'Analysis storage is unavailable.'});
  try{
   let user;try{user=await verifiedUser(req,client);}catch(e){return send(res,e.status===503?503:401,{error:e.status===503?'Analysis is temporarily unavailable. Please try again.':'Your browser connection expired. Refresh to reconnect.'});}
   const body=await readJsonBody(req,4096);
   if(body.action==='status'){
    let query=client.from('ai_analysis_jobs').select('*').eq('owner_id',user.id);
    if(body.id){if(!/^[a-f0-9-]{36}$/i.test(body.id))return send(res,400,{error:'Invalid analysis.'});query=query.eq('id',body.id);}
    else query=query.in('status',['queued','running']);
    const {data,error}=await query.order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;
    return send(res,200,{job:publicJob(data)});
   }
   if(body.action!=='start')return send(res,400,{error:'Unknown analysis action.'});
   const url=websiteUrl(body.url),domain=url.hostname.replace(/^www\./,'');
   // The deployment edge supplies this header; never accept an IP from the body.
   const ip=local?'local':String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
   if(!env.AI_CRON_SECRET)throw Error('Analysis worker configuration is missing.');
   const visitor=createHmac('sha256',env.AI_CRON_SECRET).update(ip).digest('hex');
   const job=await rpc(client,'ai_analysis_enqueue',{account_id:user.id,website_url:url.href,website_domain:domain,visitor});
   await rpc(client,'ai_analysis_wake').catch(()=>{}); // minute scheduler is the durable fallback
   return send(res,202,{job:publicJob(job)});
  }catch(e){
   const limit=/ANALYSIS_BUDGET_LOW|DAILY_VISITOR_LIMIT|DAILY_NETWORK_LIMIT|QUEUE_FULL/.test(e.message||'');
   const error=/ANALYSIS_BUDGET_LOW/.test(e.message||'')?'Analysis is paused: the service usage allowance is too low to finish 40 questions. Please contact the site owner. No analysis was started.':/DAILY_/.test(e.message||'')?'Today’s analysis limit has been reached. Your saved reports remain available.':/QUEUE_FULL/.test(e.message||'')?'Analysis capacity is full. Please try again shortly.':/^(Enter|Use |This address)/.test(e.message||'')?e.message:e.status===503?'Analysis is temporarily unavailable. Please try again.':'We could not start or load the analysis. Please refresh and try again.';
   return send(res,limit?429:503,{error});
  }
 };
}

// Journal before sending paid requests. Completed responses are replayed locally
// after an interrupted worker. Ambiguous in-flight calls never spend twice.
export function journaledRequest(client,jobId,request=fetch){
 const journal=async(url,options={},reserve)=>{
  const paid=String(url).includes('/api/v1/search?')||String(url).startsWith('https://api.openai.com/');
  if(!paid)return request(url,options);
  const fingerprint=createHash('sha256').update(JSON.stringify([String(url),options.method||'GET',options.body||''])).digest('hex');
  const {error:insertError}=await client.from('ai_analysis_requests').insert({job_id:jobId,fingerprint,status:'started'});
  if(insertError){
   if(insertError.code!=='23505')throw Error('Saved scans request journal is unavailable.');
   const {data,error}=await client.from('ai_analysis_requests').select('status,response,http_status').eq('job_id',jobId).eq('fingerprint',fingerprint).single();
   if(error)throw Error('Saved scans request journal is unavailable.');
   if(data.status!=='complete')throw Error('Saved scans: a provider request was interrupted. It will not be charged again automatically.');
   return new Response(JSON.stringify(data.response),{status:data.http_status,headers:{'Content-Type':'application/json'}});
  }
  if(reserve)await reserve();
  const started=Date.now();
  const response=await request(url,options);
  const data=await response.json();
  const {error}=await client.from('ai_analysis_requests').update({status:'complete',response:data,http_status:response.status,duration_ms:Date.now()-started,provider_kind:String(url).endsWith('/responses')?'search':'assessment'}).eq('job_id',jobId).eq('fingerprint',fingerprint);
  if(error)throw Error('Saved scans provider response could not be stored. Automatic collection stopped to prevent duplicate charges.');
  return new Response(JSON.stringify(data),{status:response.status,headers:{'Content-Type':'application/json'}});
 };
 journal.managesReservations=true;
 return journal;
}
export async function runAnalysisStep(job,{client,env,request=fetch,analyze=analyzeWebsite,fallback=searchWebsiteProfile}){
 const deadline=Date.now()+210000;
 const boundedRequest=(url,options={})=>request(url,{...options,signal:AbortSignal.any([...(options.signal?[options.signal]:[]),AbortSignal.timeout(Math.max(1,deadline-Date.now()))])});
 const store=cloudCollectorStore(client,job.owner_id),journal=journaledRequest(client,job.id,boundedRequest);
 if(!job.profile){
  const lock=await store.acquire();
  if(!lock)return {status:'queued',stage:'Preparing your new analysis',progress:0,delay:3};
  try{
   const state=await store.load();
   if(state.activeRunId!==job.id)await rpc(client,'ai_analysis_discard_previous',{account_id:job.owner_id,current_job:job.id,lock_id:lock});
  let profile;
  try{profile=await analyze(job.url);}catch(e){
   if(!canUseWebsiteFallback(e))throw e;
   profile=await fallback(job.url,{client,key:env.SEARCHAPI_API_KEY,request:journal});
  }
  const {error}=await client.from('ai_businesses').upsert({owner_id:job.owner_id,domain:profile.domain,name:profile.name,profile},{onConflict:'owner_id,domain'});if(error)throw Error('The business details could not be saved.');
  return {status:'queued',stage:'Finding competitors',progress:10,profile};
  }finally{await store.release(lock);}
 }
 const activeJobs=await client.from('ai_analysis_jobs').select('id',{count:'exact',head:true}).in('status',['queued','running']).abortSignal(AbortSignal.timeout(5000));
 const concurrency=activeJobs.error?8:Math.max(8,Math.floor(24/Math.min(3,Math.max(1,activeJobs.count||1))));
 let lastProgress=0;
 const onBenchmarkProgress=async(measured)=>{
  if(measured<4||measured-lastProgress<4)return;
  lastProgress=measured;
  // This checkpoint is cosmetic. Answer persistence has already succeeded.
  await client.from('ai_analysis_jobs').update({stage:`Analyzing buyer questions · ${measured} of ${PROMPT_TARGET} measured`,progress:20+Math.floor(measured/PROMPT_TARGET*79),updated_at:new Date().toISOString()}).eq('id',job.id).eq('lease',job.lease).abortSignal(AbortSignal.timeout(5000));
 };
 const handler=searchapiHandler({local:true,key:env.SEARCHAPI_API_KEY,analysisKey:env.OPENAI_API_KEY,analysisBudget:Number(env.AI_ANALYSIS_BUDGET_USD||1),store,budgetStore:cloudBudgetStore(client),request:journal,benchmarkConcurrency:concurrency,onBenchmarkProgress});
 const req=internalRequest({action:job.target>=40?'benchmarkStep':'baselineStep',business:job.profile});req.internalWorker=true;
 let status,result;await handler(req,{setHeader(){},set statusCode(v){status=v;},end(raw){result=JSON.parse(raw);}});
 if(result?.code==='ANALYSIS_BUSY')return {status:'queued',stage:'Waiting for your previous analysis',progress:job.progress,delay:15};
 if(status!==200||(job.target>=40?result.benchmark:result.report)?.status==='partial')throw Error(result.error||result.benchmark?.error||result.report?.error||'Analysis could not finish. Saved answers are preserved.');
 if(job.target>=40){
  const measured=result.benchmark?.total===PROMPT_TARGET?result.benchmark.completed.length:0;
  const planned=result.plan?.questions?.length||0;
  if(result.benchmark?.total===PROMPT_TARGET&&result.benchmark.status==='complete')return {status:'complete',stage:`${PROMPT_TARGET} buyer questions measured · Your insights are ready`,progress:100};
  return {status:'queued',stage:planned<PROMPT_TARGET?`Preparing buyer questions · ${planned} of ${PROMPT_TARGET} planned`:`Analyzing buyer questions · ${measured} of ${PROMPT_TARGET} measured`,progress:planned<PROMPT_TARGET?10+Math.floor(planned/PROMPT_TARGET*10):20+Math.floor(measured/PROMPT_TARGET*79)};
 }
 const report=result.report;
 if(report?.status==='complete')return {status:'complete',stage:'Your insights are ready',progress:100};
 const count=report?.completed?.length||0;
 return {status:'queued',stage:!report?.discovery?'Finding competitors':!report.questions?.length?'Preparing buyer questions':`Analyzing buyer questions · ${count} of 3 complete`,progress:report?.questions?.length?30+count*20:20};
}
export function createJobsWorker(env,{client=serverClient(env),step=runAnalysisStep}={}){
 return async(req,res)=>{
  const expected=env.AI_CRON_SECRET,provided=String(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!expected||Buffer.byteLength(provided)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(expected),Buffer.from(provided)))return send(res,401,{error:'Unauthorized worker.'});
  if(!client)return send(res,503,{error:'Storage unavailable.'});
  let job;
  try{
   job=await rpc(client,'ai_analysis_claim');if(!job)return send(res,200,{idle:true});
   let next;
   try{next=await step(job,{client,env});}catch(e){
    console.error('Analysis step failed', {jobId:job.id,domain:job.domain,code:e.code||e.name,message:e.message});
    const known=/^(OpenAI|SearchAPI|Saved scans|The website|This website|This page|That link|No usable|Indexed|Shared|Search snippet|The business|Analysis)/.test(e.message||'');
    const storageFailure=/Saved scans cloud storage failed|request journal is unavailable|Shared collection budget could not be checked/.test(e.message||'');
    next=storageFailure&&job.attempts<3?{status:'queued',stage:'Reconnecting to analysis storage',progress:job.progress,delay:15}:{status:'failed',stage:'Analysis needs attention',progress:job.progress,error:known?e.message:'Analysis was interrupted. Saved answers are preserved; please try again later.'};
   }
   const finished=await rpc(client,'ai_analysis_finish',{job_id:job.id,lock_id:job.lease,new_status:next.status,new_stage:next.stage,new_progress:next.progress,new_profile:next.profile||null,failure:next.error||null,delay_seconds:next.delay||0});
   if(!finished)throw Error('Worker lease expired.');
   await rpc(client,'ai_analysis_wake').catch(()=>{});
   return send(res,200,{status:next.status});
  }catch{return send(res,503,{error:'Worker interrupted. The queue will recover the saved job.'});}
 };
}
