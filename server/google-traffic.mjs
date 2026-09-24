import {GoogleAuth} from 'google-auth-library';

const aiSources=[['ChatGPT',/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/],['Perplexity',/(^|\.)perplexity\.ai$/],['Claude',/(^|\.)claude\.ai$/],['Gemini',/(^|\.)gemini\.google\.com$/],['Copilot',/(^|\.)copilot\.microsoft\.com$/]];
export function validateGoogleProperties(input,domain){
 if(!input||typeof input.ga4PropertyId!=='string'||typeof input.gscSiteUrl!=='string')throw Error('Enter a GA4 property ID and/or Search Console property.');
 const ga4PropertyId=input.ga4PropertyId.trim(),gscSiteUrl=input.gscSiteUrl.trim();
 if(ga4PropertyId&&!/^\d{4,20}$/.test(ga4PropertyId))throw Error('GA4 property ID must contain only digits.');
 if(gscSiteUrl){let valid=gscSiteUrl===`sc-domain:${domain}`;if(!valid)try{const u=new URL(gscSiteUrl);valid=u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname.replace(/^www\./,'')===domain&&u.pathname==='/';}catch{}if(!valid)throw Error('Search Console property must be this business domain or its HTTPS URL-prefix property.');}
 return {ga4PropertyId,gscSiteUrl};
}
export function normalizeGa4Report(data){
 const byEngine=new Map(),pages=new Map();let visits=0;
 for(const row of data.rows||[]){const source=String(row.dimensionValues?.[0]?.value||'').toLowerCase().replace(/^www\./,''),path=String(row.dimensionValues?.[1]?.value||'/'),sessions=Number(row.metricValues?.[0]?.value||0);if(!Number.isFinite(sessions)||sessions<0)continue;
 const engine=aiSources.find(([,pattern])=>pattern.test(source))?.[0];if(!engine)continue;visits+=sessions;byEngine.set(engine,(byEngine.get(engine)||0)+sessions);pages.set(path,(pages.get(path)||0)+sessions);}
 return {visits,engines:[...byEngine].map(([name,visits])=>({name,visits})).sort((a,b)=>b.visits-a.visits),pages:[...pages].map(([path,visits])=>({path,visits})).sort((a,b)=>b.visits-a.visits).slice(0,20)};
}
export function normalizeGscReport(data){return (data.rows||[]).slice(0,100).map(row=>({query:row.keys?.[0]||'',page:row.keys?.[1]||'',clicks:Number(row.clicks||0),impressions:Number(row.impressions||0),ctr:Number(row.ctr||0),position:Number(row.position||0)}));}
export function createGoogleTraffic(env={},request=fetch){
 let credentials=null;try{credentials=JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON||'null');}catch{}
 const configured=!!(credentials?.client_email&&credentials?.private_key&&credentials?.type==='service_account');
 const serviceAccount=configured?credentials.client_email:null;
 return {configured,serviceAccount,async report(properties){
  if(!configured)throw Error('Google traffic connector needs its server-only service account.');
  const auth=new GoogleAuth({credentials,scopes:['https://www.googleapis.com/auth/analytics.readonly','https://www.googleapis.com/auth/webmasters.readonly']});
  const client=await auth.getClient(),token=await client.getAccessToken();if(!token.token)throw Error('Google authorization did not return an access token.');
  const post=async(url,body)=>{const response=await request(url,{method:'POST',headers:{Authorization:`Bearer ${token.token}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000),redirect:'error'});if(!response.ok)throw Error(`Google returned ${response.status}. Check this service account's read access to the property.`);return response.json();};
  const result={at:new Date().toISOString(),ga4:null,gsc:null,errors:{}};
  if(properties.ga4PropertyId)try{const data=await post(`https://analyticsdata.googleapis.com/v1beta/properties/${properties.ga4PropertyId}:runReport`,{dateRanges:[{startDate:'30daysAgo',endDate:'yesterday'}],dimensions:[{name:'sessionSource'},{name:'landingPagePlusQueryString'}],metrics:[{name:'sessions'}],dimensionFilter:{filter:{fieldName:'sessionSource',stringFilter:{matchType:'PARTIAL_REGEXP',value:'chatgpt\\.com|chat\\.openai\\.com|perplexity\\.ai|claude\\.ai|gemini\\.google\\.com|copilot\\.microsoft\\.com'}}},limit:'10000'});result.ga4=normalizeGa4Report(data);}catch(e){result.errors.ga4=e.message;}
  if(properties.gscSiteUrl)try{const end=new Date(Date.now()-3*86400000),start=new Date(end.getTime()-29*86400000);const day=d=>d.toISOString().slice(0,10);const data=await post(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(properties.gscSiteUrl)}/searchAnalytics/query`,{startDate:day(start),endDate:day(end),dimensions:['query','page'],rowLimit:100});result.gsc=normalizeGscReport(data);}catch(e){result.errors.gsc=e.message;}
  return result;
 }};
}
