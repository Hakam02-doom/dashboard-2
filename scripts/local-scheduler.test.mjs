import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {startLocalScheduler} from '../server/local-scheduler.mjs';

test('cloud previews do not poll the monitoring database',async()=>{
 const server={httpServer:new EventEmitter()};
 let calls=0;
 assert.equal(startLocalScheduler(server,{client:{},tick:async()=>{calls++;}}),false);
 await new Promise(resolve=>setTimeout(resolve,15));
 assert.equal(calls,0);
});

test('local scheduler replaces a hot-reloaded timer and never overlaps ticks',async()=>{
 const firstServer={httpServer:new EventEmitter()};
 const secondServer={httpServer:new EventEmitter()};
 let firstCalls=0,secondCalls=0,active=0,maxActive=0;
 startLocalScheduler(firstServer,{client:null,tick:async()=>{firstCalls++;}},{period:5});
 startLocalScheduler(secondServer,{client:null,tick:async()=>{
  secondCalls++;active++;maxActive=Math.max(maxActive,active);
  await new Promise(resolve=>setTimeout(resolve,15));
  active--;
 }},{period:5});
 await new Promise(resolve=>setTimeout(resolve,45));
 secondServer.httpServer.emit('close');
 assert.equal(firstCalls,0);
 assert.ok(secondCalls>=1);
 assert.equal(maxActive,1);
});
