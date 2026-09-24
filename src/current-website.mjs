import {canonicalPageTitleName} from '../server/brand-identity.mjs';
// Only the selected site is retained in browser storage. Older multi-site
// records are reduced on the next visit; they are never merged back from cloud.
export function currentWebsiteState(profile){
 if(profile)profile={...profile,name:canonicalPageTitleName(profile.name,profile.domain)};
 return profile?{active:profile.domain,profiles:{[profile.domain]:profile}}:{active:'',profiles:{}};
}
export function selectCurrentWebsite(data){
 return currentWebsiteState(data?.profiles?.[data?.active]);
}
