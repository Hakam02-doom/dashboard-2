import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createWebsiteApiHandler} from '../api/ai/website.js';
import {searchWebsiteProfile} from '../server/website-search-fallback.mjs';

const origin='https://dashboard-2-sandy.vercel.app';
function request(token,body){const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={origin,authorization:token?`Bearer ${token}`:''};return req;}
async function invoke(handler,token,body){const res={setHeader(){},end(raw){this.body=JSON.parse(raw);}};await handler(request(token,body),res);return res;}

test('production website reader uses the signed-in account workspace and cached profile',async()=>{
 const states=new Map([['first',{attempts:0,answers:[]}],['second',{attempts:0,answers:[]}]]),calls=[];
 const client={auth:{getUser:async token=>({data:{user:{id:token}}})},from:()=>({select:()=>({eq:(_key,id)=>({maybeSingle:async()=>({data:states.has(id)?{owner_id:id}:null})})})}),rpc:async(name,args)=>{
  const owner=args.account_id;
  if(name==='ai_workspace_lock')return {data:'lease'};
  if(name==='ai_workspace_read')return {data:structuredClone(states.get(owner))};
  if(name==='ai_workspace_write'){states.set(owner,structuredClone(args.state));return {data:null};}
  if(name==='ai_workspace_unlock')return {data:null};
  throw Error(name);
 }};
 const handler=createWebsiteApiHandler({client,analyze:async url=>{calls.push(url);return {name:'Adidas',domain:'adidas.co.in',url,analyzedAt:new Date().toISOString()};}});
 const body={url:'https://www.adidas.co.in/?tracking=secret'};
 assert.equal((await invoke(handler,'first',body)).statusCode,200);
 assert.equal((await invoke(handler,'first',body)).statusCode,200);
 assert.equal(calls.length,1);
 assert.equal((await invoke(handler,'second',body)).statusCode,200);
 assert.equal(calls.length,2);
 assert.equal(states.get('first').websiteReads[Object.keys(states.get('first').websiteReads)[0]],1);
 assert.equal(states.get('second').websiteReads[Object.keys(states.get('second').websiteReads)[0]],1);
 delete states.get('first').websiteProfiles;
 const fallback=createWebsiteApiHandler({client,analyze:async()=>{throw Error('The website took too long to respond.');},searchFallback:async url=>({name:'Adidas India',domain:'adidas.co.in',url,source:'search-results',searchVersion:2,analyzedAt:new Date().toISOString()})});
 const recovered=await invoke(fallback,'first',body);
 assert.equal(recovered.statusCode,200);
 assert.equal(recovered.body.profile.source,'search-results');
 assert.equal((await invoke(handler,null,body)).statusCode,401);
 assert.equal((await invoke(handler,'unknown',body)).statusCode,403);
});

test('blocked sites use bounded, explicitly labeled indexed snippets',async()=>{
 const calls=[];
 const client={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='ai_global_usage'?{search:55,analysis:72,direct:0}:name==='ai_global_reserve'?true:null};}};
 const request=async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer test-key');
  if(url.endsWith('/me'))return {ok:true,json:async()=>({account:{remaining_credits:20,monthly_allowance:0}})};
  assert.match(url,/engine=google/);assert.match(url,/adidas\+India\+official\+website/);
  return {ok:true,json:async()=>({organic_results:[
   {title:'Adidas India | Official Store',source:'Adidas India',link:'https://www.adidas.co.in/',snippet:'Shop shoes, clothing and sportswear.'},
   {title:'Unrelated',link:'https://example.com/',snippet:'Other business.'}
  ]})};
 };
 const profile=await searchWebsiteProfile('https://www.adidas.co.in/?campaign=hidden',{client,key:'test-key',request});
  assert.equal(profile.domain,'adidas.co.in');
 assert.equal(profile.name,'Adidas India');
 assert.equal(profile.source,'search-results');
 assert.equal(profile.pages.length,1);
 assert.match(profile.scope,/No page content was read/);
 assert.equal(profile.url,'https://www.adidas.co.in/');
 assert.equal(calls.filter(call=>call.name==='ai_global_reserve').length,1);
});
