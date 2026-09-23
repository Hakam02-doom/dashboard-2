import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {readJsonBody} from '../server/request-body.mjs';
test('accepts Vercel parsed bodies and raw Node streams with the same limits',async()=>{
 for(const req of [{body:{action:'status'}},{body:'{"action":"status"}'},{body:Buffer.from('{"action":"status"}')},Readable.from(['{"action":','"status"}'])])assert.deepEqual(await readJsonBody(req),{action:'status'});
 await assert.rejects(readJsonBody({body:{oversize:'abcdef'}},4),/too large/);
 await assert.rejects(readJsonBody(Readable.from(['abcdef']),4),/too large/);
 await assert.rejects(readJsonBody({body:'broken'}),/Invalid/);
});
