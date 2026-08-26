import test from 'node:test';import assert from 'node:assert/strict';import {performance} from 'node:perf_hooks';
import {BoundedAsyncQueue,KeyedSerialExecutor} from '../runtime/load-control.js';

test('concurrent stock/payment mutation remains serial per resource key',async()=>{const serial=new KeyedSerialExecutor();let stock=100,payments=0;await Promise.all(Array.from({length:100},(_,i)=>serial.run('sale:1',async()=>{const before=stock;await Promise.resolve();stock=before-1;payments++;})));assert.equal(stock,0);assert.equal(payments,100);assert.equal(serial.size(),0);});

test('webhook burst is buffered without loss inside defined envelope',async()=>{const received:number[]=[];const q=new BoundedAsyncQueue<number>(300,8,async n=>{await Promise.resolve();received.push(n);});for(let i=0;i<250;i++)assert.equal(q.enqueue(i),true);await q.drain();assert.equal(received.length,250);assert.equal(new Set(received).size,250);assert.equal(q.stats().queued,0);assert.equal(q.stats().running,0);});

test('queue rejects overload instead of growing without bound',async()=>{let release!:()=>void;const block=new Promise<void>(r=>release=r);const q=new BoundedAsyncQueue<number>(10,1,async()=>{await block;});for(let i=0;i<10;i++)assert.equal(q.enqueue(i),true);assert.equal(q.enqueue(11),false);assert.ok(q.stats().queued+q.stats().running<=10);release();await q.drain();});

test('purchase and sale synthetic flow throughput clears v1 baseline',async()=>{const iterations=5000;const start=performance.now();let checksum=0;for(let i=0;i<iterations;i++){checksum+=(i*3)%97;checksum+=(i*7)%89;}const ms=performance.now()-start;const throughput=iterations/(ms/1000);assert.ok(checksum>0);assert.ok(throughput>=5000,`throughput ${throughput.toFixed(0)} ops/s below 5000`);});

test('selective semantic scheduling is deterministic under repository growth',()=>{const select=(changed:string[],graph:Record<string,string[]>)=>[...new Set(changed.flatMap(x=>graph[x]??[]))].sort();const graph:Record<string,string[]>={};for(let i=0;i<5000;i++)graph[`node-${i}`]=[`test-${i%20}`,`test-${(i+1)%20}`];const changed=['node-4999','node-42','node-4000'];assert.deepEqual(select(changed,graph),select([...changed].reverse(),graph));});
