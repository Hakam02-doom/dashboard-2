import {defineConfig,loadEnv} from 'vite';
import {createRuntime} from './server/cloud-runtime.mjs';
import {websiteHandler} from './server/website-handler.mjs';
import {startLocalScheduler} from './server/local-scheduler.mjs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({root,plugins:[{name:'local-business-reader',configureServer(server){
 const runtime=createRuntime(loadEnv('development',root,''),{local:true,directory:root+'.local-ai'});
 server.middlewares.use('/api/ai/searchapi',runtime.handler);
 server.middlewares.use('/api/ai/connections',runtime.connections);
 server.middlewares.use('/api/ai/website',websiteHandler({local:true}));
 startLocalScheduler(server,runtime);
}}],server:{watch:{ignored:['**/.local-ai/**']},fs:{strict:true,allow:[root]}}});
