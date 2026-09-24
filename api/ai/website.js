import {readJsonBody} from '../../server/request-body.mjs';
import {serverClient,verifiedUser} from '../../server/cloud-runtime.mjs';
import {cloudCollectorStore} from '../../server/collector-store.mjs';
import {analyzeWebsite,websiteUrl} from '../../server/website-analysis.mjs';
import {searchWebsiteProfile} from '../../server/website-search-fallback.mjs';

export const config={maxDuration:60};

export function createWebsiteApiHandler({client=serverClient(process.env),analyze=analyzeWebsite,searchFallback=(url)=>searchWebsiteProfile(url,{client,key:process.env.SEARCHAPI_API_KEY})}={}){
 const send=(res,code,body)=>{res.statusCode=code;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
 return async function(req,res){
  if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
  if(req.headers.origin!=='https://dashboard-2-sandy.vercel.app')return send(res,403,{error:'Open Dashboard 2.'});
  if(!client)return send(res,503,{error:'Website analysis is temporarily unavailable.'});
  let user;
  try{user=await verifiedUser(req,client);}catch(e){return send(res,401,{error:e.message});}
  const {data:workspace,error:workspaceError}=await client.from('ai_collector_workspaces').select('owner_id').eq('owner_id',user.id).maybeSingle();
  if(workspaceError)return send(res,503,{error:'Monitoring storage is temporarily unavailable.'});
  if(!workspace)return send(res,403,{error:'Connect this account to AI Visibility first.'});
  let url;
  try{url=websiteUrl((await readJsonBody(req,4096)).url).href;}catch(e){return send(res,400,{error:/^(Enter|Use)/.test(e.message)?e.message:'Enter a valid website.'});}
  const store=cloudCollectorStore(client,user.id);
  let lease;
  try{
   lease=await store.acquire();if(!lease)return send(res,429,{error:'Another analysis is running. Try again shortly.'});
   const state=await store.load(),day=new Date().toISOString().slice(0,10),cached=state.websiteProfiles?.[url];
   if(cached&&(cached.source!=='search-results'||cached.searchVersion===2)&&Date.parse(cached.analyzedAt)>Date.now()-86400000)return send(res,200,{profile:cached});
   state.websiteReads ||= {};if((state.websiteReads[day]||0)>=30)return send(res,429,{error:'Daily website-read limit reached.'});
   state.websiteReads[day]=(state.websiteReads[day]||0)+1;await store.save(state,lease);
   let profile;
   try{profile=await analyze(url);}catch(siteError){
    if(!/HTTP (403|429)\b|took too long to (?:respond|resolve)/i.test(siteError.message||''))throw siteError;
    try{profile=await searchFallback(url);}catch{throw Error('The website blocked automated reading, and indexed details were unavailable. Enter the business details manually.');}
   }
   state.websiteProfiles={...state.websiteProfiles,[url]:profile};await store.save(state,lease);
   return send(res,200,{profile});
  }catch(e){return send(res,422,{error:/^(Enter|Use |This |The website|That link)/.test(e.message)?e.message:'We could not read that website. Try its public home page, or enter the business details manually.'});}
  finally{if(lease)await store.release(lease).catch(()=>{});}
 };
}

export default createWebsiteApiHandler();
