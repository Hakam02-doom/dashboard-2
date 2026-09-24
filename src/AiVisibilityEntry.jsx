import {currentWebsiteState,selectCurrentWebsite} from './current-website.mjs';
import {AiGuestWorkspace} from './AiGuestWorkspace';
import {aiFetch} from './ai-cloud';
import React,{useState,useEffect,useRef} from 'react';
import {Globe2,ArrowRight,Check,ArrowLeft,RefreshCw,Building2} from 'lucide-react';
import {AiWorkspace} from './AiWorkspace';
import {BUSINESS_KEY,businessStorageKey,publicWebsite,validBusiness} from './ai-business';
import {analysisRequest} from './analysis-request.mjs';
import {followAnalysisJob,hasEarlyResults} from './analysis-jobs-client.mjs';
import './ai-insights.css';

function originalProfile({onboarding,market,...profile}){return profile;}
function readBusinesses(userId,legacyOwner){
 try{
  const key=businessStorageKey(userId);
  const raw=localStorage.getItem(key)||(legacyOwner?localStorage.getItem(BUSINESS_KEY):null);
  if(!raw)return {active:'',profiles:{},error:''};
  const data=JSON.parse(raw);
  if(!data||typeof data.active!=='string'||!data.profiles||!Object.values(data.profiles).every(validBusiness))throw Error();
  const current=selectCurrentWebsite(data);
  if(current.active)current.profiles[current.active]=originalProfile(current.profiles[current.active]);
  localStorage.setItem(key,JSON.stringify(current));
  return {...current,error:''};
 }catch{return {active:'',profiles:{},error:'Saved website details could not be read. Your existing data has been preserved.'};}
}
export function AiVisibilityEntry(props){
 return <AiGuestWorkspace>{({user,legacyOwner})=><AiVisibilityContent {...props} key={user.id} userId={user.id} legacyOwner={legacyOwner}/>}</AiGuestWorkspace>;
}
function AiVisibilityContent(props){
 const storageKey=businessStorageKey(props.userId);
 const [initial]=useState(()=>readBusinesses(props.userId,props.legacyOwner));
 const [businesses,setBusinesses]=useState(initial);
 const active=businesses.profiles[businesses.active];
 const [editing,setEditing]=useState(true),[url,setUrl]=useState(initial.profiles[initial.active]?.url||'');
 const [busy,setBusy]=useState(false),[stage,setStage]=useState('');
 const [error,setError]=useState(initial.error),[readyDomain,setReadyDomain]=useState('');
 const running=useRef(false),watcher=useRef(null);
 const [job,setJob]=useState(null);
 useEffect(()=>()=>watcher.current?.abort(),[]);

 async function collect(action,business){
  return analysisRequest(()=>aiFetch('/api/ai/searchapi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,business}),signal:AbortSignal.timeout(305000)}),{onWaiting:setStage});
 }
 async function jobRequest(body){
  const response=await aiFetch('/api/ai/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  const result=await response.json();if(!response.ok)throw Error(result.error||'The analysis service is unavailable.');return result;
 }
 function openReport(profile){
  const next=currentWebsiteState(profile);
  localStorage.setItem(storageKey,JSON.stringify(next));setBusinesses(next);
  setReadyDomain(profile.domain);setEditing(false);setError('');
 }
 async function watchJob(initial){
  localStorage.setItem(storageKey+':job',initial.id);setJob(initial);setStage(initial.status==='queued'?'Queued · '+initial.stage:initial.stage);setUrl(initial.url);
  watcher.current?.abort();const controller=new AbortController();watcher.current=controller;
  const done=await followAnalysisJob(initial.id,{request:jobRequest,signal:controller.signal,isReady:hasEarlyResults,onJob:next=>{setJob(next);setStage(next.status==='queued'?'Queued · '+next.stage:next.stage);}});
  if(!validBusiness(done.profile))throw Error('The completed business profile could not be loaded.');
  openReport(done.profile);props.onToast(done.status==='complete'?'Your AI Insights are ready.':'Your first results are ready. The full analysis continues in the background.');
 }
 async function startWebsite(target){
  const {job:next}=await jobRequest({action:'start',url:target});
  const cleared=currentWebsiteState();localStorage.setItem(storageKey,JSON.stringify(cleared));setBusinesses(cleared);setReadyDomain('');
  await watchJob(next);
 }
 async function analyze(event){
  event.preventDefault();if(running.current)return;
  let target;try{target=publicWebsite(url);}catch{setError('Enter a website such as example.com.');return;}
  running.current=true;setBusy(true);setError('');setStage('Adding your analysis…');
  try{await startWebsite(target.href);}catch(e){if(e.name!=='AbortError')setError(e.message);}
  finally{running.current=false;setBusy(false);}
 }
 async function openSaved(profile){
  if(running.current)return;
  running.current=true;setBusy(true);setError('');setUrl(profile.url);setStage('Opening your current report…');
  try{const result=await collect('list',profile);if(result.answers?.length)openReport(profile);else await startWebsite(profile.url);}
  catch(e){if(e.name!=='AbortError')setError(e.message);}finally{running.current=false;setBusy(false);}
 }
 useEffect(()=>{
  let active=true;
  jobRequest({action:'status',id:localStorage.getItem(storageKey+':job')||undefined}).then(async({job:pending})=>{
   if(!active||running.current)return;
   if(!pending){const profile=initial.profiles[initial.active];if(profile)await openSaved(profile);return;}
   if(pending.status==='failed'){
    setUrl(pending.url);setError(pending.error);
    if(validBusiness(pending.profile)){
     const result=await collect('list',pending.profile);
     if(active&&result.answers?.length){openReport(pending.profile);props.onToast(pending.error||'Showing the answers completed before analysis stopped.');}
    }
    return;
   }
   running.current=true;setBusy(true);setError('');
   try{await watchJob(pending);}catch(e){if(active&&e.name!=='AbortError')setError(e.message);}
   finally{running.current=false;if(active)setBusy(false);}
  }).catch(()=>{});
  return()=>{active=false;};
 },[]);
 if(editing)return <section className="cs-page ai-onboarding">
  <div className="cs-page-intro"><div><h2>See how AI sees your business.</h2><p>Enter your website. We’ll find competitors, ask relevant questions, and build your insights.</p></div>{active&&readyDomain===active.domain&&<button className="cs-button" disabled={busy} onClick={()=>setEditing(false)}><ArrowLeft size={16}/>Back to insights</button>}</div>
  <div className="aiv-intake-layout"><div className="panel aiv-intake">
   <span className="aiv-symbol"><Globe2 size={27}/></span><h3>Start with your website.</h3><p>One link. 40 buyer questions. Your brand, competitors, and AI visibility in one place.</p>
   <form onSubmit={analyze}><label htmlFor="business-website">Business website</label><div className="aiv-url-field"><Globe2 size={19}/><input id="business-website" autoComplete="url" inputMode="url" required maxLength={2048} placeholder="yourbusiness.com" value={url} onChange={e=>{setUrl(e.target.value);setError('');}} disabled={busy}/></div><p className="aiv-hint">Your current website stays open on refresh. Changing websites starts a fresh report.</p><button className="cs-button filled" disabled={busy||!url.trim()}>{busy?<><RefreshCw size={16} className="aiv-spin"/>Analyzing website…</>:<>Analyze website<ArrowRight size={16}/></>}</button></form>
   {busy&&<div className="aiv-analysis-progress" role="status" aria-live="polite"><strong>{stage}</strong>{job&&<progress max="100" value={job.progress} aria-label="Analysis progress"/>}<p>Your report opens after the first four measured answers. The remaining questions continue in the background, even if you close this page.</p>{job?.progress>=21&&job?.profile&&<button type="button" className="cs-button" onClick={()=>{watcher.current?.abort();setBusy(false);running.current=false;openReport(job.profile);}}>View available results<ArrowRight size={16}/></button>}</div>}
   {error&&<div className="aiv-error" role="alert"><p>{error}</p></div>}


  </div><aside className="panel aiv-intake-aside"><h3>From your website to real insights.</h3><ol>{[['Your business','We read your website to understand what you offer.'],['Your competition','We find brands appearing in the same AI answers.'],['Your visibility','See mentions, sentiment, rankings, and cited sources.']].map(([title,copy])=><li key={title}><Check size={17}/><div><strong>{title}</strong><p>{copy}</p></div></li>)}</ol><div className="aiv-aside-note"><Building2 size={20}/><p>Every score is based on collected answers. Your first report is a starting point you can expand over time.</p></div></aside></div>
 </section>;
 return <><div className="aiv-business-bar"><span className="aiv-symbol"><Globe2 size={20}/></span><div><strong>{active.name}</strong><span>{active.domain} · AI visibility business</span></div><button className="cs-button" onClick={()=>{setUrl('');setEditing(true);}}>Change website</button></div><AiWorkspace {...props} key={active.domain} business={active}/></>;
}
