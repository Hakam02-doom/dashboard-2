const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function followAnalysisJob(id,{request,onJob=()=>{},sleep=pause,signal}={}){
 let failures=0;
 while(!signal?.aborted){
  let job;
  try{({job}=await request({action:'status',id}));failures=0;}catch(e){
   if(signal?.aborted)throw e;
   if(++failures>=5)throw Error('The connection was interrupted. Your analysis continues in the background. Refresh to reconnect.');
   await sleep(5000);continue;
  }
  if(!job)throw Error('This analysis is no longer available in this browser.');
  onJob(job);
  if(job.status==='complete')return job;
  if(job.status==='failed')throw Error(job.error||'Analysis stopped. Saved answers are preserved.');
  await sleep(5000);
 }
 throw new DOMException('Stopped watching the analysis','AbortError');
}
