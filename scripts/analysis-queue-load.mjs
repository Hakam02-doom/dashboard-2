// Explicit integration test: creates isolated temporary owners/jobs and removes
// them afterward. No provider calls, worker dispatch, or budget changes.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {serverClient} from '../server/cloud-runtime.mjs';
import {createJobsApi} from '../server/analysis-jobs.mjs';
import {Readable} from 'node:stream';
if(process.env.D2_QUEUE_LOAD_TEST!=='1'||process.env.D2_QUEUE_WORKER_PAUSED!=='1')throw Error('Run only before enabling the worker scheduler: set D2_QUEUE_LOAD_TEST=1 and D2_QUEUE_WORKER_PAUSED=1.');
const c=serverClient(process.env),owners=[],jobs=[];const run=randomUUID();
async function rpc(name,args={}){const {data,error}=await c.rpc(name,args);if(error)throw error;return data;}
async function finish(j,status='complete'){return rpc('ai_analysis_finish',{job_id:j.id,lock_id:j.lease,new_status:status,new_stage:'Integration test',new_progress:status==='complete'?100:20,new_profile:null,failure:null,delay_seconds:0});}
const before=await rpc('ai_global_usage');
try{
 for(let i=0;i<12;i++){
  const {data,error}=await c.auth.admin.createUser({email:`queue-${run}-${i}@example.com`,password:randomUUID()+randomUUID(),email_confirm:true});if(error)throw error;owners.push(data.user.id);
 }
 const duplicate=await Promise.all(Array.from({length:100},()=>rpc('ai_analysis_enqueue',{account_id:owners[0],website_url:'https://example.com/',website_domain:'example.com',visitor:run+'-0'})));
 assert.equal(new Set(duplicate.map(j=>j.id)).size,1);jobs.push(duplicate[0].id);
 for(let i=1;i<owners.length;i++)for(let n=0;n<2;n++){const job=await rpc('ai_analysis_enqueue',{account_id:owners[i],website_url:`https://site-${n}.example.com/`,website_domain:`site-${n}.example.com`,visitor:run+'-'+i});jobs.push(job.id);}
 const started=await Promise.all(Array.from({length:30},()=>rpc('ai_analysis_claim')));const active=started.filter(Boolean);
 assert.equal(active.length,3);assert.equal(new Set(active.map(j=>j.owner_id)).size,3);assert.equal(new Set(active.map(j=>j.id)).size,3);
 for(const job of active)assert.ok(jobs.includes(job.id),'unexpected non-test job: stop before touching it');
 assert.equal(await finish({...active[0],lease:randomUUID()}),false,'stale workers must not write');
 // Simulate a terminated process. The next claim must recover its saved job.
 await c.from('ai_analysis_jobs').update({lease_until:new Date(Date.now()-1000).toISOString()}).eq('id',active[0].id);
 const recovered=await rpc('ai_analysis_claim');assert.ok(recovered);assert.ok(jobs.includes(recovered.id));assert.notEqual(recovered.lease,active[0].lease);
 assert.equal(await finish(active[0]),false,'expired token cannot commit');
 await finish(recovered);await finish(active[1]);await finish(active[2]);
 let finished=3,rounds=0;
 while(finished<jobs.length&&rounds++<20){
  const group=(await Promise.all(Array.from({length:10},()=>rpc('ai_analysis_claim')))).filter(Boolean);
  assert.ok(group.length>0&&group.length<=3);assert.equal(new Set(group.map(j=>j.owner_id)).size,group.length);
  for(const j of group){assert.ok(jobs.includes(j.id));await finish(j);finished++;}
 }
 assert.equal(finished,jobs.length);
 // Per-visitor and per-network limits remain atomic under concurrent submissions.
 const visitorResults=await Promise.allSettled(Array.from({length:10},(_,i)=>rpc('ai_analysis_enqueue',{account_id:owners[0],website_url:`https://limit-${i}.example.com`,website_domain:`limit-${i}.example.com`,visitor:run+'-0'})));
 assert.equal(visitorResults.filter(r=>r.status==='fulfilled').length,2);
 assert.ok(visitorResults.filter(r=>r.status==='rejected').every(r=>/DAILY_VISITOR_LIMIT/.test(r.reason.message)));
 const network=run+'-shared';
 const networkResults=await Promise.allSettled(owners.slice(1).map((id,i)=>rpc('ai_analysis_enqueue',{account_id:id,website_url:`https://network-${i}.example.com`,website_domain:`network-${i}.example.com`,visitor:network})));
 assert.equal(networkResults.filter(r=>r.status==='fulfilled').length,10);
 assert.ok(networkResults.filter(r=>r.status==='rejected').every(r=>/DAILY_NETWORK_LIMIT/.test(r.reason.message)));
 // HTTP ownership filtering, using a verified identity adapter and real DB.
 const isolatedClient={from:c.from.bind(c),rpc:c.rpc.bind(c),auth:{getUser:async()=>({data:{user:{id:owners[1]}}})}};
 const api=createJobsApi(process.env,{client:isolatedClient});
 const req=Readable.from([JSON.stringify({action:'status',id:jobs[0]})]);req.method='POST';req.headers={origin:'https://dashboard-2-sandy.vercel.app',authorization:'Bearer test'};
 const res={setHeader(){},end(raw){this.body=JSON.parse(raw);}};await api(req,res);assert.equal(res.body.job,null);
 assert.deepEqual(await rpc('ai_global_usage'),before);
 console.log(JSON.stringify({duplicateSubmissions:100,uniqueDuplicateJob:1,parallelClaimRequests:30,maximumWorkers:3,completedJobs:finished,expiredWorkerRecovery:'passed',staleWriterProtection:'passed',visitorAndNetworkLimits:'passed',crossVisitorIsolation:'passed',providerSpend:0}));
}finally{
 for(const id of owners){const {error}=await c.auth.admin.deleteUser(id);if(error)console.error('Test cleanup failed:',error.message);}
}
