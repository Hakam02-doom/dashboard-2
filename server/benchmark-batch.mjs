// Keep a single workspace lease while overlapping independent provider calls.
// Await every task before releasing that lease, including when one task fails.
export async function runBenchmarkBatch({questions,completed,findAnswer,collect,assess,finish,concurrency=4}){
 const remaining=questions.filter(q=>!completed.includes(q.id));
 const saved=remaining.filter(q=>findAnswer(q));
 const batch=(saved.length?saved:remaining).slice(0,Math.max(1,Math.min(4,concurrency)));
 const outcomes=await Promise.allSettled(batch.map(async q=>{
  const answer=findAnswer(q);
  if(!answer){await collect(q);return;}
  if(!answer.answer.brandAssessment)await assess(q,answer);
  await finish(q);
 }));
 const failure=outcomes.find(result=>result.status==='rejected');
 if(failure)throw failure.reason;
 return batch.length;
}
