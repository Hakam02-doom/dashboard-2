export const AUTH_RETRY_KEY='d2-ai-auth-retry-at';
export async function withAuthTimeout(promise,milliseconds=15000){
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{const error=new Error('The sign-in service did not respond in time.');error.name='TimeoutError';reject(error);},milliseconds);})]);}
 finally{clearTimeout(timer);}
}
export function authFailure(error){
 if(error?.status===429||/rate.?limit|too many requests/i.test(error?.message||''))return 'Too many sign-in emails have been requested. Use the most recent link already in your inbox, or try again later. No new email was sent.';
 if(error?.status>=500)return 'The sign-in service is temporarily unavailable. Keep the latest email link and retry this step shortly.';
 if(error?.name==='TimeoutError'||/timed? out|operation was aborted/i.test(error?.message||''))return 'The monitoring connection is taking too long. Please try again shortly; your saved results are still there.';
 return error?.message||'Sign-in could not be completed. Please try again.';
}
export function emailLinkFailure(error){
 if(error?.status===429||/rate.?limit|too many requests/i.test(error?.message||''))return authFailure(error);
 if(error?.status>=500||error?.name==='TimeoutError')return 'The email service did not confirm this request. Check your inbox for a new link before trying again.';
 return authFailure(error);
}
export function retrySeconds(until,now=Date.now()){return Math.max(0,Math.ceil((Number(until||0)-now)/1000));}
