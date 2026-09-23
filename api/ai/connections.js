import {createRuntime} from '../../server/cloud-runtime.mjs';
const runtime=createRuntime(process.env);
export default runtime.connections;
