import test from 'node:test';
import assert from 'node:assert/strict';
import {answerPosition} from '../server/answer-position.mjs';
test('reads explicit numbered and table rankings with brand aliases',()=>{
 assert.equal(answerPosition('### 2. **[Acme Tools](https://acme.com)** — a tool',['Acme','Acme Tools']).position,2);
 assert.equal(answerPosition('| Rank | Platform |\n|---|---|\n| 3 | Acme |',['Acme']).position,3);
});
test('does not turn comparisons or topic headings into ranks',()=>{
 assert.equal(answerPosition('### 1. SEO tools\nAcme is useful.',['Acme']),null);
 assert.equal(answerPosition('| Platform | Features |\n| Acme | Good |',['Acme']),null);
 assert.equal(answerPosition('1. Acme\n2. Acme',['Acme']),null);
});
