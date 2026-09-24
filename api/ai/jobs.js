import {createJobsApi} from '../../server/analysis-jobs.mjs';
export const config={maxDuration:30};
export default createJobsApi(process.env);
