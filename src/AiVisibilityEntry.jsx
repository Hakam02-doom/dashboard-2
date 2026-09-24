import {AiGuestWorkspace} from './AiGuestWorkspace';
import {aiFetch,loadCloudBusinesses,saveCloudBusiness} from './ai-cloud';
import React,{useState,useEffect,useRef} from 'react';
import {Globe2,ArrowRight,Check,ArrowLeft,RefreshCw,Building2} from 'lucide-react';
import {AiWorkspace} from './AiWorkspace';
import {BUSINESS_KEY,businessStorageKey,publicWebsite,validBusiness} from './ai-business';
import {generateWebsiteInsights} from './website-insights-flow.mjs';
import './ai-insights.css';

function originalProfile({onboarding,market,...profile}){return profile;}
function readBusinesses(userId,legacyOwner){
 try{
  const key=businessStorageKey(userId);
  const raw=localStorage.getItem(key)||(legacyOwner?localStorage.getItem(BUSINESS_KEY):null);
  if(!raw)return {active:'',profiles:{},error:''};
  const data=JSON.parse(raw);
  if(!data||typeof data.active!=='string'||!data.profiles||!Object.values(data.profiles).every(validBusiness))throw Error();
  return {...data,profiles:Object.fromEntries(Object.entries(data.profiles).map(([key,value])=>[key,originalProfile(value)])),error:''};
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
 const [editing,setEditing]=useState(true),[url,setUrl]=useState('');
 const [draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[stage,setStage]=useState('');
 const [error,setError]=useState(initial.error),[readyDomain,setReadyDomain]=useState('');
 const running=useRef(false);
 useEffect(()=>{let mounted=true;loadCloudBusinesses().then(rows=>{
  if(!mounted||!rows.length)return;
  setBusinesses(prev=>{const profiles={...prev.profiles};for(const row of rows)profiles[row.domain]=originalProfile(row.profile);return {...prev,profiles};});
 }).catch(()=>{});return()=>{mounted=false;};},[props.userId]);

 async function collect(action,business){
  const response=await aiFetch('/api/ai/searchapi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,business}),signal:AbortSignal.timeout(305000)});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Analysis is temporarily unavailable. Please try again.');
  return data;
 }
 async function finish(profile){
  if(!validBusiness(profile))throw Error('We could not identify this business. Add its details below to continue.');
  const next={active:profile.domain,profiles:{...businesses.profiles,[profile.domain]:profile}};
  localStorage.setItem(storageKey,JSON.stringify(next));
  await saveCloudBusiness(profile);
  setBusinesses(next);
  const result=await generateWebsiteInsights(profile,{collect,onStage:setStage});
  setReadyDomain(profile.domain);setDraft(null);setEditing(false);setError('');
  props.onToast(result.report?.status==='partial'?'Your first results are ready. Some questions still need analysis.':'Your AI Insights are ready.');
 }
 async function analyze(event){
  event.preventDefault();if(running.current)return;
  let target;try{target=publicWebsite(url);}catch{setError('Enter a website such as example.com.');return;}
  running.current=true;setBusy(true);setError('');setDraft(null);setStage('Reading your website…');
  try{
   const response=await aiFetch('/api/ai/website',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:target.href}),signal:AbortSignal.timeout(65000)});
   const data=await response.json();
   if(!response.ok||!validBusiness(data.profile))throw Error(data.error||'We could not read the business details from this website.');
   await finish(data.profile);
  }catch(e){setError(e.name==='TimeoutError'?'The analysis is taking longer than expected. Your progress is saved; try again to continue.':e.message.startsWith('Unexpected')?'The analysis service did not respond. Please try again.':e.message);}
  finally{running.current=false;setBusy(false);setStage('');}
 }
 async function openSaved(profile){
  if(running.current)return;
  running.current=true;setBusy(true);setError('');setUrl(profile.url);
  try{await finish(profile);}catch(e){setError(e.message);}finally{running.current=false;setBusy(false);setStage('');}
 }
 function manual(){
  try{const target=publicWebsite(url);setDraft({name:'',description:'',domain:target.hostname.replace(/^www\./,''),url:target.href,headings:[],schemaTypes:[],source:'manual',analyzedAt:null});setError('');}
  catch{setError('Enter the business website first.');}
 }
 async function save(event){event.preventDefault();if(!draft)return;await openSaved({...draft,name:draft.name.trim(),description:draft.description.trim()});}
 if(editing)return <section className="cs-page ai-onboarding">
  <div className="cs-page-intro"><div><h2>See how AI sees your business.</h2><p>Enter your website. We’ll find competitors, ask relevant questions, and build your insights.</p></div>{active&&readyDomain===active.domain&&<button className="cs-button" disabled={busy} onClick={()=>setEditing(false)}><ArrowLeft size={16}/>Back to insights</button>}</div>
  <div className="aiv-intake-layout"><div className="panel aiv-intake">
   <span className="aiv-symbol"><Globe2 size={27}/></span><h3>Start with your website.</h3><p>One link. Your brand, competitors, and AI visibility in one place.</p>
   <form onSubmit={analyze}><label htmlFor="business-website">Business website</label><div className="aiv-url-field"><Globe2 size={19}/><input id="business-website" autoComplete="url" inputMode="url" required maxLength={2048} placeholder="yourbusiness.com" value={url} onChange={e=>{setUrl(e.target.value);setDraft(null);setError('');}} disabled={busy}/></div><p className="aiv-hint">Results are saved for this browser. No account or email needed.</p><button className="cs-button filled" disabled={busy||!url.trim()}>{busy?<><RefreshCw size={16} className="aiv-spin"/>Analyzing website…</>:<>Analyze website<ArrowRight size={16}/></>}</button></form>
   {busy&&<div className="aiv-analysis-progress" role="status" aria-live="polite"><strong>{stage}</strong><p>We’re collecting real answers and checking the evidence. This can take a few minutes.</p></div>}
   {error&&<div className="aiv-error" role="alert"><p>{error}</p>{!draft&&<button className="ai-text-button" onClick={manual} disabled={busy}>Add business details manually</button>}</div>}
   {draft&&<form className="aiv-review" onSubmit={save}><h3>Tell us about the business</h3><label>Business name<input required maxLength={100} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>What your business offers<textarea rows={3} required maxLength={600} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label><button className="cs-button filled" disabled={busy}>Analyze business<ArrowRight size={16}/></button></form>}
   {Object.keys(businesses.profiles).length>0&&<section className="aiv-saved-sites" aria-label="Saved websites"><h3>Your websites</h3><p>Continue with a website you’ve already added.</p><div>{Object.values(businesses.profiles).map(profile=><button type="button" key={profile.domain} className="cs-button" onClick={()=>openSaved(profile)} disabled={busy}><strong>{profile.name}</strong><span>{profile.domain}</span><ArrowRight size={15}/></button>)}</div></section>}
  </div><aside className="panel aiv-intake-aside"><h3>From your website to real insights.</h3><ol>{[['Your business','We read your website to understand what you offer.'],['Your competition','We find brands appearing in the same AI answers.'],['Your visibility','See mentions, sentiment, rankings, and cited sources.']].map(([title,copy])=><li key={title}><Check size={17}/><div><strong>{title}</strong><p>{copy}</p></div></li>)}</ol><div className="aiv-aside-note"><Building2 size={20}/><p>Every score is based on collected answers. Your first report is a starting point you can expand over time.</p></div></aside></div>
 </section>;
 return <><div className="aiv-business-bar"><span className="aiv-symbol"><Globe2 size={20}/></span><div><strong>{active.name}</strong><span>{active.domain} · AI visibility business</span></div><button className="cs-button" onClick={()=>{setUrl('');setEditing(true);}}>Change website</button></div><AiWorkspace {...props} key={active.domain} business={active}/></>;
}
