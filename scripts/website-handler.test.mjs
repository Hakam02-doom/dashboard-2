import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { websiteHandler } from '../server/website-handler.mjs';

async function invoke(handler, { method = 'POST', origin = 'http://127.0.0.1:5174', contentType = 'application/json', body = '{"url":"example.com"}' } = {}) {
  const req = Readable.from([body]);
  req.method = method;
  req.headers = { origin, 'content-type': contentType };
  const res = { headers: {}, setHeader(key,value) { this.headers[key]=value; }, end(value) { this.body=JSON.parse(value); } };
  await handler(req,res);
  return res;
}

test('production stays closed and rejected local requests never fetch a website', async () => {
  let calls = 0;
  const analyze = async () => { calls++; return { name: 'Example' }; };
  assert.equal((await invoke(websiteHandler({analyze}))).statusCode,503);
  const local = websiteHandler({local:true,analyze});
  for (const [request,code] of [[{method:'GET'},405],[{origin:'https://unrelated.example'},403],[{contentType:'text/plain'},415],[{body:'x'.repeat(4097)},413],[{body:'not json'},400]]) {
    assert.equal((await invoke(local,request)).statusCode,code);
  }
  assert.equal(calls,0);
  assert.equal((await invoke(local)).statusCode,200);
  assert.equal(calls,1);
});

test('unexpected reader errors are not exposed to the browser', async () => {
  const handler = websiteHandler({local:true,analyze:async()=>{throw new Error('secret internal connection details');}});
  const res=await invoke(handler);
  assert.equal(res.statusCode,422);
  assert.ok(!res.body.error.includes('secret'));
});
