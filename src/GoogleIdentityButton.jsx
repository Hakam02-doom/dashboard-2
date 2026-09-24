import React,{useEffect,useRef,useState} from 'react';

// OAuth client IDs are public identifiers. The matching secret stays in Google Cloud and Supabase.
const clientId='147967563573-tsdp5b3q223rgv0sotadq5n93g989jng.apps.googleusercontent.com';
let scriptPromise;

function googleIdentity(){
 if(window.google?.accounts?.id)return Promise.resolve(window.google.accounts.id);
 if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://accounts.google.com/gsi/client';
  script.async=true;
  script.onload=()=>window.google?.accounts?.id?resolve(window.google.accounts.id):reject(Error('Google sign-in did not load.'));
  script.onerror=()=>reject(Error('Google sign-in did not load.'));
  document.head.append(script);
 }).catch(error=>{scriptPromise=null;throw error;});
 return scriptPromise;
}

async function noncePair(){
 const raw=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)));
 return [raw,Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('')];
}

export function GoogleIdentityButton({onCredential,onError,disabled=false}){
 const slot=useRef(null),credential=useRef(onCredential),failed=useRef(onError),[ready,setReady]=useState(false);
 credential.current=onCredential;failed.current=onError;
 useEffect(()=>{
  let active=true,stopObserver;
  Promise.all([googleIdentity(),noncePair()]).then(([google,[nonce,hashedNonce]])=>{
   if(!active||!slot.current)return;
   google.initialize({client_id:clientId,nonce:hashedNonce,use_fedcm_for_prompt:true,callback:response=>{
    if(active&&response?.credential)credential.current(response.credential,nonce);
   }});
   const render=()=>{if(!slot.current)return;slot.current.replaceChildren();google.renderButton(slot.current,{type:'standard',theme:document.documentElement.dataset.theme==='dark'?'filled_black':'outline',size:'large',shape:'pill',text:'continue_with',width:320});};
   render();
   const observer=new MutationObserver(render);
   observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
   stopObserver=()=>observer.disconnect();
   setReady(true);
  }).catch(error=>{if(active)failed.current(error);});
  return()=>{active=false;stopObserver?.();};
 },[]);
 return <div className={'aiv-google-identity'+(disabled?' is-disabled':'')} aria-busy={!ready}>
  <div ref={slot}/>
  {!ready&&<span role="status">Loading Google sign-in…</span>}
 </div>;
}
