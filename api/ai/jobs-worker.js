import {createJobsWorker} from '../../server/analysis-jobs.mjs';
export const config={maxDuration:240};
export default createJobsWorker(process.env);
