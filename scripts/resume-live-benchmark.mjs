// Privileged local pilot runner. Never use in browser code. Run with:
// node --env-file=.env.local scripts/resume-live-benchmark.mjs searchable.com
import {serverClient,internalRequest} from '../server/cloud-runtime.mjs';
import {cloudCollectorStore,cloudBudgetStore} from '../server/collector-store.mjs';
import {searchapiHandler} from '../server/searchapi-handler.mjs';

const sites=new Map([
 ['adidas.co.in','adidas IN'],
 ['upliftai.co','Uplift AI'],
 ['framer.com','Framer'],
 ['youtube.com','YouTube'],
 ['searchable.com','Searchable Limited'],
]);
const domain=process.argv[2],name=sites.get(domain);
if(!name)throw Error('Choose one of the five audited pilot domains.');
const client=serverClient(process.env);
if(!client||!process.env.OPENAI_API_KEY)throw Error('Dashboard 2 cloud and OpenAI credentials are required.');
const {data:workspaces,error}=await client.from('ai_collector_workspaces').select('owner_id,payload').limit(100);
if(error)throw Error('Could not identify the benchmark workspace.');
const matches=workspaces.filter(row=>row.payload?.benchmarks?.[domain]);
if(matches.length!==1)throw Error('Benchmark workspace is missing or ambiguous.');
const handler=searchapiHandler({local:true,analysisKey:process.env.OPENAI_API_KEY,analysisBudget:Number(process.env.AI_ANALYSIS_BUDGET_USD||1),store:cloudCollectorStore(client,matches[0].owner_id),budgetStore:cloudBudgetStore(client)});
const call=async action=>{
 let response;
 await handler(internalRequest({action,business:{name,domain}}),{setHeader(){},end(body){response={status:this.statusCode,...JSON.parse(body)};}});
 if(response.status!==200)throw Error(response.error||`The collector returned ${response.status}.`);
 return response;
};
if(process.argv.includes('--expand')){
 const expanded=await call('benchmarkExpand');
 console.log(JSON.stringify({domain,target:expanded.benchmark.total,status:expanded.benchmark.status}));
}
let failures=0;
for(let i=0;i<33;i++){
 const result=await call('benchmarkNext');
 const current={domain,completed:result.benchmark?.completed?.length||0,target:result.benchmark?.total,status:result.benchmark?.status,error:result.benchmark?.error||null,reserved:result.analysisBudget?.reserved};
 console.log(JSON.stringify(current));
 if(current.status==='complete')break;
 if(current.status==='partial'){failures++;if(failures>=2)break;}else failures=0;
}
