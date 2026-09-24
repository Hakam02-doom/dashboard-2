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
 if(emailSendLimited(error))return 'This workspace has reached its email sending limit. Use Google sign-in or a recent unused email link; email links will be available again later.';
 if(error?.status>=500||error?.name==='TimeoutError')return 'The email service did not confirm this request. Check your inbox for a new link before trying again.';
 return authFailure(error);
}
export function emailSendLimited(error){return error?.code==='over_email_send_rate_limit'||error?.status===429||/rate.?limit|too many requests/i.test(error?.message||'');}
export function authRedirectFailure(hash){
 const params=new URLSearchParams(String(hash||'').replace(/^#/,''));
 if(!params.has('error'))return '';
 if(params.get('error_code')==='otp_expired')return 'That email link has expired or was already used. Try Google sign-in, or request one new email link when email sending is available.';
 return 'Sign-in was not completed. Please choose a sign-in method and try again.';
}
export function retrySeconds(until,now=Date.now()){return Math.max(0,Math.ceil((Number(until||0)-now)/1000));}
