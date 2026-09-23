import {readFile,writeFile,mkdir,rename,open,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
export function localCollectorStore(directory='.local-ai') {
 const file=join(directory,'searchapi.json'),lock=file+'.lock';
 return {
  kind:'local',
  async load(){try{const s=JSON.parse(await readFile(file,'utf8'));if(!Number.isInteger(s.attempts)||!Array.isArray(s.answers))throw Error();return s;}catch(e){if(e.code==='ENOENT')return {attempts:0,answers:[]};throw Error('Saved scans could not be read. Existing data was preserved.');}},
  async save(state){await mkdir(directory,{recursive:true});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(state),{mode:0o600});await rename(temp,file);},
  async acquire(){await mkdir(directory,{recursive:true});try{const f=await open(lock,'wx',0o600);const token=randomUUID();await f.writeFile(JSON.stringify({token,pid:process.pid,at:Date.now()}));await f.close();return token;}catch(e){if(e.code!=='EEXIST')throw e;const prior=await readFile(lock,'utf8').then(JSON.parse).catch(()=>null);if(prior&&Date.now()-prior.at>900000){try{process.kill(prior.pid,0);}catch(err){if(err.code==='ESRCH'){await unlink(lock);return this.acquire();}}}return null;}},
  async release(token){const prior=await readFile(lock,'utf8').then(JSON.parse).catch(()=>null);if(prior?.token===token)await unlink(lock);}
 };
}
export function cloudCollectorStore(client) {
 const rpc=async(name,args={})=>{const {data,error}=await client.rpc(name,args);if(error)throw Error('Saved scans cloud storage failed. Retry after checking the connection.');return data;};
 return {kind:'cloud',load:()=>rpc('ai_collector_read'),acquire:()=>rpc('ai_collector_lock',{lease:randomUUID()}),save:(state,token)=>rpc('ai_collector_write',{payload:state,lease:token}),release:token=>rpc('ai_collector_unlock',{lease:token})};
}
