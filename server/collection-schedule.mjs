import {createHash} from 'node:crypto';
const engines=['chatgpt','gemini','claude-api','gemini-api','perplexity-api'];
export function validateSchedule(input,business,now=new Date()){
 if(!input||!['daily','weekly'].includes(input.cadence)||!Array.isArray(input.engines)||!input.engines.length||input.engines.some(e=>!engines.includes(e))||!Array.isArray(input.questions)||!input.questions.length||input.questions.length>24)throw Error('Schedule: choose 1–24 questions, supported engines and daily or weekly collection.');
 const questions=input.questions.map(q=>{if(typeof q.text!=='string'||!q.text.trim()||q.text.length>500||typeof q.topic!=='string'||q.topic.length>100||!['Branded','Unbranded'].includes(q.type))throw Error('Schedule: invalid question.');return {text:q.text.trim(),topic:q.topic,type:q.type};});
 if(new Set(questions.map(q=>q.text.toLowerCase().replace(/\s+/g,' '))).size!==questions.length)throw Error('Schedule: duplicate questions.');
 return {business:{name:business.name,domain:business.domain},cadence:input.cadence,engines:[...new Set(input.engines)],questions,enabled:input.enabled===true,nextAt:new Date(now.getTime()+86400000).toISOString(),updatedAt:now.toISOString(),error:null};
}
export function enqueueDue(state,now=new Date()){
 state.jobs ||= [];
 for(const schedule of Object.values(state.schedules||{})){
  if(!schedule.enabled||schedule.oneShotQueued||Date.parse(schedule.nextAt)>now.getTime())continue;
  const day=now.toISOString().slice(0,10);
  for(const question of schedule.questions)for(const engine of schedule.engines){const id=createHash('sha256').update(JSON.stringify([schedule.business.domain,question.text.toLowerCase(),engine,day])).digest('hex');if(!state.jobs.some(j=>j.id===id))state.jobs.push({id,business:schedule.business,question,engine,status:'queued',createdAt:now.toISOString(),day});}
  if(schedule.oneShot)schedule.oneShotQueued=true;
  schedule.nextAt=new Date(now.getTime()+(schedule.cadence==='weekly'?7:1)*86400000).toISOString();
 }
 // Ambiguous interrupted calls are not automatically retried or charged twice.
 for(const j of state.jobs)if(j.status==='running'&&Date.parse(j.startedAt)<now.getTime()-900000){j.status='failed';j.error='Worker interrupted. Review provider history before collecting again.';j.finishedAt=now.toISOString();}
 state.jobs=state.jobs.filter(j=>['queued','running'].includes(j.status)||Date.parse(j.finishedAt||j.createdAt)>now.getTime()-30*86400000);
 return state.jobs.find(j=>j.status==='queued'&&state.schedules?.[j.business.domain]?.enabled);
}
