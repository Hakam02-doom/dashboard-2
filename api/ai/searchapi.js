import {createRuntime} from '../../server/cloud-runtime.mjs';
export const config={maxDuration:300};
const runtime=createRuntime(process.env);
export default runtime.handler;
