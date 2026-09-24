const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

// Only retry a lock rejection: the server has not called a provider or spent a
// credit. Never replay a timed-out provider request or a quota/budget failure.
export async function analysisRequest(request,{onWaiting=()=>{},sleep=pause,maxWaits=132}={}){
 for(let attempt=0;;attempt++){
  const response=await request();
  const data=await response.json();
  if(response.ok)return data;
  if(response.status===429&&data.code==='ANALYSIS_BUSY'){
   if(attempt>=maxWaits)throw new Error('Another analysis is still finishing. Your details are saved. Please try again shortly.');
   onWaiting('Another analysis is finishing. Yours will continue automatically…');
   await sleep(Math.min(15,Math.max(5,Number(data.retryAfter)||5))*1000);
   continue;
  }
  const error=new Error(data.error||'Analysis is temporarily unavailable. Please try again.');
  error.code=data.code;
  throw error;
 }
}
