// Retire the removed setup flow without deleting collected answers or user research.
export function rollbackOnboarding(state){
 const entries=Object.entries(state.onboarding||{});
 if(!entries.length)return false;
 state.retiredOnboarding ||= {};
 for(const [domain,setup] of entries){
  state.retiredOnboarding[domain]={setup,competitors:state.competitors?.[domain],report:state.reports?.[domain],plan:state.plans?.[domain],schedule:state.schedules?.[domain],measurementProfile:state.measurementProfiles?.[domain]};
  for(const key of ['competitors','reports','plans','measurementProfiles','onboardingDiscovery'])if(state[key])delete state[key][domain];
  if(state.schedules?.[domain])state.schedules[domain].enabled=false;
  for(const job of state.jobs||[])if(job.business?.domain===domain&&job.status==='queued')job.status='cancelled';
  for(const row of state.libraries?.[domain]?.rows||[])if(row.id?.startsWith('onboarding-')){row.tracking=false;row.status='archived';}
 }
 delete state.onboarding;
 return true;
}
