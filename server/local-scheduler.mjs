const schedulerKey=Symbol.for('dashboard2.localScheduler');

export function startLocalScheduler(server,runtime,{period=60000}={}){
 const previous=globalThis[schedulerKey];
 if(previous){clearInterval(previous.timer);globalThis[schedulerKey]=null;}

 // The dedicated pg_cron job schedules every cloud workspace. Local previews
 // must not also poll those workspaces, especially across Vite hot reloads.
 if(runtime.client)return false;

 let running=false;
 const scheduler={timer:setInterval(async()=>{
  if(running)return;
  running=true;
  try{await runtime.tick();}catch{}finally{running=false;}
 },period)};
 scheduler.timer.unref();
 globalThis[schedulerKey]=scheduler;
 server.httpServer?.once('close',()=>{
  clearInterval(scheduler.timer);
  if(globalThis[schedulerKey]===scheduler)globalThis[schedulerKey]=null;
 });
 return true;
}
