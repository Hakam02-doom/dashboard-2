const pending=new WeakMap();

// Reuse the device's existing workspace, including pre-guest-mode history.
// Concurrent mounts share one request so they cannot create competing guests.
export function ensureGuestSession(client){
 if(!client)return Promise.reject(new Error('The analysis service is not configured.'));
 if(pending.has(client))return pending.get(client);
 const request=(async()=>{
  const current=await client.auth.getSession();
  if(current.error)throw current.error;
  if(current.data.session?.user)return current.data.session.user;
  const created=await client.auth.signInAnonymously();
  if(created.error)throw created.error;
  if(!created.data.session?.user)throw new Error('Your workspace could not be prepared.');
  return created.data.session.user;
 })().finally(()=>pending.delete(client));
 pending.set(client,request);
 return request;
}
