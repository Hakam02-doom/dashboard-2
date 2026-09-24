import { createClient } from '@supabase/supabase-js';
import { validBusiness } from './ai-business';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const aiCloud = url && key ? createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'d2-ai-auth'}}) : null;

async function currentUser() {
 if(!aiCloud)throw new Error('Cloud connection is not configured.');
 let timer;
 let response;
 try{response=await Promise.race([aiCloud.auth.getUser(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('The monitoring connection is taking too long. Please try again shortly.')),20000);})]);}
 finally{clearTimeout(timer);}
 const {data,error}=response;
 if(error||!data.user)throw new Error('Your workspace connection expired. Refresh the page to reconnect.');
 return data.user;
}
export async function saveCloudBusiness(profile) {
 if(!validBusiness(profile))throw new Error('Review the business profile before saving.');
 const user=await currentUser();
 const {data,error}=await aiCloud.from('ai_businesses').upsert({owner_id:user.id,domain:profile.domain,name:profile.name,profile},{onConflict:'owner_id,domain'}).select('id').single().abortSignal(AbortSignal.timeout(20000));
 if(error)throw new Error('The business details could not be saved. Please retry.');
 return data.id;
}
export async function loadCloudBusinesses() {
 const user=await currentUser();
 const {data,error}=await aiCloud.from('ai_businesses').select('id,domain,name,profile').eq('owner_id',user.id).order('created_at',{ascending:false}).abortSignal(AbortSignal.timeout(20000));
 if(error)throw new Error('Cloud businesses could not be loaded.');
 return data.filter(row=>validBusiness(row.profile));
}
export async function loadCloudAnswers(domain) {
 if(!aiCloud)return [];
 const {data:{session}}=await aiCloud.auth.getSession();
 if(!session)return [];
 const user=await currentUser();
 const {data:business,error}=await aiCloud.from('ai_businesses').select('id').eq('owner_id',user.id).eq('domain',domain).maybeSingle();
 if(error)throw new Error('Unable to load your cloud business.');
 if(!business)return [];
 const {data:runs,error:runError}=await aiCloud.from('ai_runs').select('id,engine,collection_method').eq('business_id',business.id).in('status',['complete','partial']).order('requested_at',{ascending:false}).limit(100);
 if(runError)throw new Error('Unable to load monitoring history.');
 if(!runs.length)return [];
 const {data,error:answerError}=await aiCloud.from('ai_answers').select('*').in('run_id',runs.map(r=>r.id)).order('captured_at',{ascending:false}).limit(1000);
 if(answerError)throw new Error('Unable to load collected answers.');
 return data.map(row=>{const run=runs.find(r=>r.id===row.run_id);return {id:row.id,at:row.captured_at,engine:run.engine,method:run.collection_method,prompt:row.prompt_text,answer:row.answer_text,mentioned:row.brand_mentioned,cited:row.brand_cited,position:row.brand_position===null?null:Number(row.brand_position),sentiment:({positive:'Positive',neutral:'Neutral',negative:'Negative'})[row.sentiment]||'Not assessed',topic:row.topic||'General',type:'Unclassified',location:row.location||'Not specified',sources:row.source_urls||[],fanout:row.fanout_queries||[],competitors:[]};});
}

export async function aiFetch(url,options={}){
 const session=aiCloud?(await aiCloud.auth.getSession()).data.session:null;
 return fetch(url,{...options,headers:{...options.headers,...(session?{Authorization:`Bearer ${session.access_token}`}:{})}});
}
export async function syncBusinessProfiles(profiles){
 if(!aiCloud||!(await aiCloud.auth.getSession()).data.session)return;
 for(const profile of Object.values(profiles))await saveCloudBusiness(profile);
}
