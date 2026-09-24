import React,{useEffect,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {aiCloud,aiFetch} from './ai-cloud';
import {ensureGuestSession} from './guest-session.mjs';

export function AiGuestWorkspace({children}){
 const [workspace,setWorkspace]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let active=true;
  setError('');
  (async()=>{
   const user=await ensureGuestSession(aiCloud);
   const response=await aiFetch('/api/ai/connections',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"action":"claim"}',signal:AbortSignal.timeout(65000)});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||'Your workspace could not be prepared.');
   if(active)setWorkspace({user,legacyOwner:result.legacyOwner});
  })().catch(()=>{if(active)setError('We couldn’t prepare your analysis workspace. Please try again.');});
  return()=>{active=false;};
 },[attempt]);
 if(workspace)return children(workspace);
 return <section className="cs-page ai-onboarding"><div className="panel aiv-intake" aria-busy={!error}><h2>Understand your AI visibility.</h2>{error?<><p role="alert">{error}</p><button className="cs-button filled" onClick={()=>setAttempt(n=>n+1)}>Try again</button></>:<p role="status"><RefreshCw size={16} className="aiv-spin"/> Getting ready for your website…</p>}</div></section>;
}
