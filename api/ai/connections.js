import {createRuntime} from '../../server/cloud-runtime.mjs';
export const config={maxDuration:60};
const runtime=createRuntime(process.env);
export default runtime.connections;
