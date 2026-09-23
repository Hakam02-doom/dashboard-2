export const PROMPT_STORAGE_KEY = 'd2-ai-prompt-library-v1';
export const promptSuggestions = [
  ['What does Uplift AI do?', 'Brand awareness', 'Branded'],
  ['How does Uplift AI help small businesses with SEO?', 'Brand awareness', 'Branded'],
  ['Which tools help small businesses improve AI search visibility?', 'AI visibility', 'Unbranded'],
  ['How can a local business get mentioned in AI answers?', 'AI visibility', 'Unbranded'],
  ['How do I plan a month of SEO content for a small business?', 'Content strategy', 'Unbranded'],
  ['What should I check before publishing AI-generated content?', 'Content strategy', 'Unbranded'],
].map(([text, topic, type], i) => ({ id: `starter-${i}`, text, topic, type }));
export const normalizePrompt = text => text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
export function validatePromptRows(rows) {
  return Array.isArray(rows) && new Set(rows.map(p => p?.id)).size === rows.length && rows.every(p => p && typeof p.id === 'string' && p.id.length > 0 && typeof p.text === 'string' && p.text.trim() && p.text.length <= 500 && typeof p.topic === 'string' && p.topic.length <= 80 && ['Branded', 'Unbranded'].includes(p.type) && ['saved', 'archived'].includes(p.status));
}
export function addPromptRows(existing, candidates, makeId = () => crypto.randomUUID()) {
  const seen = new Set(existing.map(p => normalizePrompt(p.text)));
  const added = [];
  for (const candidate of candidates) {
    const text = candidate.text.trim().replace(/\s+/g, ' ');
    if (!text || text.length > 500 || seen.has(normalizePrompt(text))) continue;
    seen.add(normalizePrompt(text));
    added.push({ id: makeId(), text, topic: candidate.topic.trim().slice(0, 80) || 'General', type: candidate.type === 'Branded' ? 'Branded' : 'Unbranded', status: 'saved', intent:candidate.intent||'Custom question' });
  }
  return { rows: [...existing, ...added], added: added.length, skipped: candidates.length - added.length };
}
export function promptCsv(rows) {
  const quote = value => '"' + (/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""') + '"';
  return [['Prompt', 'Topic', 'Type', 'Status'], ...rows.map(p => [p.text, p.topic, p.type, p.status])].map(row => row.map(quote).join(',')).join('\r\n');
}

export function readPromptLibrary(storage, key = PROMPT_STORAGE_KEY) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return { rows: [], error: '' };
    const parsed = JSON.parse(raw);
    if (!validatePromptRows(parsed)) throw new Error('Invalid library');
    return { rows: parsed, error: '' };
  } catch {
    return { rows: [], error: 'Your saved library could not be read. It has not been changed. Restore browser storage access or recover the saved library before adding questions.' };
  }
}
