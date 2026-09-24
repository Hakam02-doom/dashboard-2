// Each question moves directly from search to evidence assessment. A slow
// sibling never holds up completed searches, and every task settles before
// the workspace lease can be released.
export async function runBenchmarkBatch({questions,completed,findAnswer,collect,assess,finish,concurrency=24}){
 const remaining=questions.filter(q=>!completed.includes(q.id));
 const saved=remaining.filter(q=>findAnswer(q));
 const fresh=remaining.filter(q=>!findAnswer(q));
 const width=Number.isFinite(concurrency)?Math.max(1,Math.min(24,Math.floor(concurrency))):24;
 const batch=[...saved,...fresh].slice(0,width);
 const outcomes=await Promise.allSettled(batch.map(async q=>{
  let answer=findAnswer(q);
  if(!answer){await collect(q);answer=findAnswer(q);}
  if(!answer)throw Error('Saved scans: collected answer was not persisted.');
  if(!answer.answer.brandAssessment)await assess(q,answer);
  await finish(q);
 }));
 const failure=outcomes.find(result=>result.status==='rejected');
 if(failure)throw failure.reason;
 return batch.length;
}
