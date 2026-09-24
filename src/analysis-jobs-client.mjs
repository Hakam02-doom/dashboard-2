const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function followAnalysisJob(id,{request,onJob=()=>{},sleep=pause,signal,isReady=()=>false}={}){
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
  if(isReady(job))return job;
  await sleep(5000);
 }
 throw new DOMException('Stopped watching the analysis','AbortError');
}

export const hasEarlyResults=job=>[40,100].includes(job?.target)&&!!job.profile&&job.progress>=20+Math.floor(4/job.target*79)&&['queued','running'].includes(job.status);
