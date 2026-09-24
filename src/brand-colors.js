import { knownBrandIdentity } from './brand-identities.js';

// Unknown brands receive stable, distinct chart colors, not invented official colors.
const chartPalette = ['#8871ca', '#398baa', '#b76886', '#479785', '#b47a32', '#637dc4', '#a477ba', '#67934c'];
export function brandColor(brand) {
  const identity = knownBrandIdentity(brand.name, brand.domain);
  if (identity) return identity.color;
  const key = String(brand.domain || brand.name || '').toLowerCase().replace(/^www\./, '');
  let hash = 0;
  for (const character of key) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0;
  return chartPalette[hash % chartPalette.length];
}
