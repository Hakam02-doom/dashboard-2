// Presentation identities only: these never change measured brands or results.
// Product aliases keep logos available even when an answer does not cite the brand.
const records = [
  ['semrush.com', '#ff642d', ['Semrush'], 'semrush.png'],
  ['ahrefs.com', '#0649de', ['Ahrefs'], 'ahrefs.png'],
  ['seranking.com', '#ffbc00', ['SE Ranking']],
  ['upliftai.co', '#7356ff', ['Uplift AI'], 'uplift-ai.png'],
  ['brightlocal.com', '#08cb35', ['BrightLocal']],
  ['buffer.com', '#101653', ['Buffer'], 'buffer.png'],
  ['activecampaign.com', '#004cff', ['ActiveCampaign']],
  ['hootsuite.com', '#ff414a', ['Hootsuite']],
  ['hubspot.com', '#ff5c35', ['HubSpot'], 'hubspot.png'],
  ['searchatlas.com', '#7135ef', ['Search Atlas'], 'search-atlas.ico'],
  ['conductor.com', '#8bc63f', ['Conductor'], 'conductor.png'],
  ['outrank.so', '#8039ed', ['Outrank'], 'outrank.png'],
  ['morningscore.io', '#6554c0', ['Morningscore'], 'morningscore.png'],
  ['framer.com', '#111111', ['Framer']],
  ['webflow.com', '#146ef5', ['Webflow']],
  ['wix.com', '#111111', ['Wix', 'Wix Studio', 'Wix / Wix Studio']],
  ['squarespace.com', '#222222', ['Squarespace']],
  ['wordpress.com', '#3858e9', ['WordPress', 'WordPress.com']],
  ['elementor.com', '#92003b', ['Elementor']],
  ['duda.co', '#f66035', ['Duda']],
  ['dorik.com', '#5138ee', ['Dorik']],
  ['figma.com', '#f24e1e', ['Figma', 'Figma Sites']],
  ['youtube.com', '#ff0033', ['YouTube']],
  ['tiktok.com', '#25f4ee', ['TikTok']],
  ['instagram.com', '#e1306c', ['Instagram']],
  ['facebook.com', '#0866ff', ['Facebook']],
  ['vimeo.com', '#1ab7ea', ['Vimeo']],
  ['twitch.tv', '#9146ff', ['Twitch']],
  ['dailymotion.com', '#0066dc', ['Dailymotion']],
  ['snapchat.com', '#ffdf00', ['Snapchat']],
  ['rumble.com', '#85c742', ['Rumble']],
  ['chatgpt.com', '#10a37f', ['ChatGPT', 'OpenAI ChatGPT', 'ChatGPT by OpenAI']],
  ['openai.com', '#10a37f', ['OpenAI']],
  ['claude.ai', '#d97757', ['Claude', 'Claude AI', 'Claude by Anthropic', 'Anthropic Claude', 'Claude Code'], undefined, ['claude.com']],
  ['anthropic.com', '#d97757', ['Anthropic']],
  ['mistral.ai', '#fa520f', ['Mistral', 'Mistral AI', 'Mistral Vibe', 'Le Chat', 'Le Chat by Mistral']],
  ['duck.ai', '#de5833', ['Duck.ai', 'Duck AI']],
  ['duckduckgo.com', '#de5833', ['DuckDuckGo']],
  ['kimi.com', '#027aff', ['Kimi', 'Kimi AI', 'Kimi by Moonshot'], undefined, ['kimi.ai']],
  ['firefly.adobe.com', '#ff3344', ['Adobe Firefly', 'Firefly']],
  ['adobe.com', '#ff0000', ['Adobe']],
  ['github.com', '#6e40c9', ['GitHub', 'GitHub Copilot']],
  ['canva.com', '#00c4cc', ['Canva', 'Canva AI', 'Canva Magic Studio']],
  ['cursor.com', '#262626', ['Cursor', 'Cursor AI'], undefined, ['cursor.sh']],
  ['notebooklm.google.com', '#4285f4', ['NotebookLM', 'NotebookLM by Google', 'Google NotebookLM'], undefined, ['notebook.google.com']],
  ['gemini.google.com', '#4285f4', ['Gemini', 'Google Gemini', 'Gemini by Google']],
  ['perplexity.ai', '#20808d', ['Perplexity', 'Perplexity AI']],
  ['copilot.microsoft.com', '#0078d4', ['Microsoft Copilot']],
  ['deepseek.com', '#4d6bfe', ['DeepSeek', 'DeepSeek AI']],
  ['grok.com', '#333333', ['Grok', 'Grok AI']],
  ['writesonic.com', '#8463ff', ['Writesonic', 'ChatSonic', 'ChatSonic by Writesonic']],
  ['hix.ai', '#47b5a0', ['HIX.ai', 'HIX AI']],
  ['easemate.ai', '#981ef7', ['Easemate.ai', 'EaseMate AI']],
];

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const byName = new Map();
const byDomain = new Map();
for (const [domain, color, names, asset, aliases = []] of records) {
  const identity = { domain, color, asset };
  for (const name of names) byName.set(normalize(name), identity);
  for (const host of [domain, ...aliases]) byDomain.set(host, identity);
}

export function knownBrandIdentity(name, domain = '') {
  let host = '';
  try { host = new URL(domain.includes('://') ? domain : `https://${domain}`).hostname.toLowerCase().replace(/^www\./, ''); } catch { /* Name-only identity. */ }
  const hosted = byDomain.get(host) || [...byDomain].find(([d]) => host.endsWith(`.${d}`))?.[1];
  return hosted || (!host ? byName.get(normalize(name)) : undefined);
}

export function knownBrandByName(name) {
  return byName.get(normalize(name));
}
