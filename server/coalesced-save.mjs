// Concurrent callers share a durable snapshot. A caller only resolves after a
// snapshot containing its revision has been stored. Failures reject every waiter.
export function coalescedSave(write){
 let revision=0,persisted=0,latest,runner=null,waiters=[];
 const flush=async()=>{
  try{
   while(persisted<revision){
    const target=revision,snapshot=structuredClone(latest);
    await write(snapshot);persisted=target;
    const ready=waiters.filter(w=>w.revision<=persisted);
    waiters=waiters.filter(w=>w.revision>persisted);
    ready.forEach(w=>w.resolve());
   }
  }catch(error){const failed=waiters;waiters=[];persisted=revision;failed.forEach(w=>w.reject(error));}
  finally{runner=null;}
 };
 return state=>{
  latest=state;const current=++revision;
  const promise=new Promise((resolve,reject)=>waiters.push({revision:current,resolve,reject}));
  if(!runner)runner=Promise.resolve().then(flush);
  return promise;
 };
}
