export const AUTH_RETRY_KEY='d2-ai-auth-retry-at';
export function authFailure(error){
 if(error?.status===429||/rate.?limit|too many requests/i.test(error?.message||''))return 'Too many sign-in emails have been requested. Use the most recent link already in your inbox, or try again later. No new email was sent.';
 return error?.message||'Sign-in could not be completed. Please try again.';
}
export function retrySeconds(until,now=Date.now()){return Math.max(0,Math.ceil((Number(until||0)-now)/1000));}
