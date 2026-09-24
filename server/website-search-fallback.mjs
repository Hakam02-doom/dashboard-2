import {requestWithReservation} from './provider-request.mjs';
import {websiteUrl} from './website-analysis.mjs';
import {cloudBudgetStore} from './collector-store.mjs';
import {canonicalWebsiteName,domainBrandLabel} from './brand-identity.mjs';

/** Indexed snippets are a limited fallback when a public site rejects server reads. */
export async function searchWebsiteProfile(input,{client,key,request=fetch,now=new Date()}={}){
 if(!client||!key)throw Error('Search snippet fallback is unavailable.');
 const url=websiteUrl(input),domain=url.hostname.replace(/^www\./,'');
 const headers={Authorization:`Bearer ${key}`};
 const reserve=async()=>{
 const accountResponse=await request('https://www.searchapi.io/api/v1/me',{headers,signal:AbortSignal.timeout(10000),redirect:'error'});
 if(!accountResponse.ok)throw Error('Search snippet fallback is unavailable.');
 const account=await accountResponse.json();
 if(account.subscription||account.account?.monthly_allowance!==0||!(account.account?.remaining_credits>0))throw Error('Search snippet fallback needs free trial credits.');
 const budget=cloudBudgetStore(client),usage=await budget.usage();
 if(usage.search>=100||!(await budget.reserve('search',100)))throw Error('Shared search trial limit reached.');
 };
 const region={in:'India',uk:'United Kingdom',au:'Australia',ca:'Canada',de:'Germany',fr:'France',jp:'Japan',sg:'Singapore',nz:'New Zealand'}[domain.split('.').at(-1)]||'';
 const query=`${domainBrandLabel(domain).replace(/[-_]/g,' ')} ${region} official website`.replace(/\s+/g,' ').trim();
 const response=await requestWithReservation(request,'https://www.searchapi.io/api/v1/search?'+new URLSearchParams({engine:'google',q:query}),{headers,signal:AbortSignal.timeout(20000),redirect:'error'},reserve);
 if(!response.ok)throw Error('Search snippet fallback did not return usable results.');
 const data=await response.json();
 const rows=(Array.isArray(data.organic_results)?data.organic_results:[]).filter(row=>{
  try{const host=websiteUrl(row.link).hostname.replace(/^www\./,'');return host===domain||host.endsWith('.'+domain);}catch{return false;}
 }).slice(0,5);
 if(!rows.length)throw Error('No indexed pages were found for this website.');
 const first=rows.find(row=>{try{return websiteUrl(row.link).pathname==='/';}catch{return false;}})||rows[0];
 const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
 const source=clean(first.source),titleName=clean(first.title?.split(/\s[|–—]\s/)[0]).replace(/\b(?:official website|homepage)\b/ig,'').trim();
 const name=canonicalWebsiteName((source&&!source.toLowerCase().includes(domain)?source:titleName||domainBrandLabel(domain)).slice(0,100),domain);
 const description=clean(first.snippet).slice(0,600);
 if(!name||!description)throw Error('Indexed results did not include enough business details.');
 return {domain,url:url.href,name,description,headings:[],schemaTypes:[],title:clean(first.title).slice(0,200),analyzedAt:now.toISOString(),source:'search-results',searchVersion:2,wordCount:0,language:'',pages:rows.map(row=>({url:websiteUrl(row.link).href,title:clean(row.title).slice(0,200),description:clean(row.snippet).slice(0,600),headings:[]})),scope:`${rows.length} indexed search snippets reviewed; the website blocked automated reading. No page content was read.`};
}
