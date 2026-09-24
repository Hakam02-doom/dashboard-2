// A website opens results only when real, assessed answers are available.
// Saved reports are reused before any collection request is made.
export async function generateWebsiteInsights(profile,{collect,onStage=()=>{}}){
 onStage('Checking saved results…');
 const existing=await collect('list',profile);
 if(existing.answers?.length)return existing;
 onStage('Finding competitors and analyzing AI answers…');
 const result=await collect('baseline',profile);
 if(!result.answers?.length)throw new Error(result.report?.error||'The analysis did not return usable answers. Your progress is saved; try again to continue.');
 return result;
}
