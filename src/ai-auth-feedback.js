export const AUTH_RETRY_KEY='d2-ai-auth-retry-at';
export function authFailure(error){
 if(error?.status===429||/rate.?limit|too many requests/i.test(error?.message||''))return 'Too many sign-in emails have been requested. Use the most recent link already in your inbox, or try again later. No new email was sent.';
 if(error?.name==='TimeoutError'||/timed? out|operation was aborted/i.test(error?.message||''))return 'The monitoring connection is taking too long. Please try again shortly; your saved results are still there.';
 return error?.message||'Sign-in could not be completed. Please try again.';
}
export function retrySeconds(until,now=Date.now()){return Math.max(0,Math.ceil((Number(until||0)-now)/1000));}
