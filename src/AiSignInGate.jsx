import React,{useEffect,useRef,useState} from 'react';
import {X,ShieldCheck} from 'lucide-react';
import {aiCloud} from './ai-cloud';
import {AiCloudAccount} from './AiCloudAccount';
export function AiSignInGate({children,onExit}){
 const [ready,setReady]=useState(false),dialog=useRef(null);
 useEffect(()=>{if(!ready)dialog.current?.showModal();return()=>dialog.current?.close();},[ready]);
 useEffect(()=>{if(!aiCloud)return;const {data}=aiCloud.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(event==='TOKEN_REFRESHED'&&!session))setReady(false);});return()=>data.subscription.unsubscribe();},[]);
 if(ready)return children;
 return <><section className="cs-page ai-onboarding"><div className="cs-page-intro"><div><h2>Your AI visibility starts here.</h2><p>Sign in to connect your website and track your business.</p></div></div></section><dialog className="aiv-auth-dialog" ref={dialog} aria-label="Sign in to AI Visibility" onCancel={e=>{e.preventDefault();onExit();}}><button className="aiv-auth-close" onClick={onExit} aria-label="Close sign-in and return to dashboard"><X size={20}/></button><span className="aiv-auth-icon"><ShieldCheck size={26}/></span><AiCloudAccount entry onConnected={()=>setReady(true)}/></dialog></>;
}
