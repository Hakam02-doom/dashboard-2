export function validateMeasurementProfile(value,names){
 if(!value||value.reviewed!==true)throw Error('Confirm the business and competitor list before saving.');
 const aliases={};
 for(const name of names){
  const list=value.aliases?.[name]||[];
  if(!Array.isArray(list)||list.length>6||list.some(a=>typeof a!=='string'||a.trim().length<3||a.length>80))throw Error('Use up to six aliases per brand, each 3–80 characters.');
  aliases[name]=[...new Set(list.map(a=>a.trim()))];
 }
 const owners=new Map();
 for(const name of names)for(const alias of [name,...aliases[name]]){
  const normalized=alias.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
  if(owners.has(normalized)&&owners.get(normalized)!==name)throw Error('An alias cannot identify two different brands.');
  owners.set(normalized,name);
 }
 return {reviewed:true,aliases,names:[...names],reviewedAt:new Date().toISOString()};
}
