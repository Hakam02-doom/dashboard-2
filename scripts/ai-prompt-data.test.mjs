import test from 'node:test';
import assert from 'node:assert/strict';
import { addPromptRows, validatePromptRows, readPromptLibrary, promptCsv } from '../src/ai-prompt-data.js';
const candidate = { text: 'What does Uplift AI do?', topic: 'Brand awareness', type: 'Branded' };
test('deduplicates case and whitespace, including archived questions', () => {
 const existing = [{ ...candidate, id: '1', status: 'archived' }];
 const result = addPromptRows(existing, [{ ...candidate, text: '  WHAT  does uplift ai do? ' }, { ...candidate, text: 'New question?' }, { ...candidate, text: 'New question?' }], () => '2');
 assert.equal(result.added, 1); assert.equal(result.skipped, 2); assert.equal(result.rows[1].status, 'saved');
});
test('rejects oversized and blank questions and normalizes empty topics', () => {
 const result = addPromptRows([], [{ ...candidate, text: ' ' }, { ...candidate, text: 'a'.repeat(501) }, { ...candidate, topic: ' ' }], () => '1');
 assert.equal(result.added, 1); assert.equal(result.rows[0].topic, 'General');
});
test('validates storage and refuses malformed or duplicate ids', () => {
 const row = { ...candidate, id: '1', status: 'saved' };
 assert.ok(validatePromptRows([row])); assert.equal(validatePromptRows([row, row]), false);
 assert.equal(validatePromptRows([{ ...row, status: 'live' }]), false);
 assert.ok(readPromptLibrary({ getItem: () => '{broken' }).error);
 assert.ok(readPromptLibrary({ getItem: () => { throw Error('blocked'); } }).error);
 assert.deepEqual(readPromptLibrary({ getItem: () => JSON.stringify([row]) }).rows, [row]);
});
test('CSV quotes embedded punctuation and protects formula-like values', () => {
 const result = promptCsv([{ text: '=SUM(1,2)', topic: 'A "quote"', type: 'Branded', status: 'saved' }]);
 assert.ok(result.includes('"\'=SUM(1,2)"')); assert.ok(result.includes('"A ""quote"""'));
 assert.ok(result.includes('\r\n'));
});
