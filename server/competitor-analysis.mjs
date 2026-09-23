const normalized = value => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const initialCompetitors = domain => domain === 'upliftai.co' ? ['Semrush','Ahrefs','SE Ranking','BrightLocal','Buffer','ActiveCampaign','Hootsuite'] : [];
export function validateCompetitors(value, ownName) {
 if (!Array.isArray(value) || value.length > 12) throw new Error('Enter up to 12 competitor names.');
 const seen = new Set([normalized(ownName)]);
 return value.map(name => {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80 || !normalized(name)) throw new Error('Each competitor needs a name of 1–80 characters.');
  const key = normalized(name);
  if(seen.has(key))throw new Error('Remove duplicate names and your own brand from the competitor list.');
  seen.add(key);return name.trim();
 });
}
export function compareAnswer(row, business, names) {
 const text = ` ${normalized((row.answer || '').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/https?:\/\/\S+/g,''))} `;
 const has = name => text.includes(` ${normalized(name)} `);
 // One mention per brand per answer; repeated names never inflate share of voice.
 const mentions = names.filter(has);
 return {...row,mentioned:has(business.name),competitors:mentions,trackedCompetitors:names,
  comparisonAssessed:names.length>0,competitorMetrics:Object.fromEntries(names.map(name=>[name,{position:null,sentiment:'Not assessed'}])),
  matchMethod:'Case-insensitive whole-name matching in answer text',comparisonVersion:1};
}
