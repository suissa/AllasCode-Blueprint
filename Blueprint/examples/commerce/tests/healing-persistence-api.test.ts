import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createExecutionKernel } from '../runtime/execution-kernel.js';
import { createCommerceState } from '../runtime/state.js';
import { FlowRuntime } from '../runtime/flow-runtime.js';
import { InMemoryEventBus } from '../runtime/event-bus.js';
import { JsonFileHealingStore } from '../runtime/healing-store.js';
import { OperatorHealingApi } from '../runtime/operator-healing-api.js';
import type { PurchaseInput, SaleInput } from '../runtime/types.js';

test('pending human case survives store restart and is queryable by operator API', async t => {
  const directory=await mkdtemp(join(tmpdir(),'allascode-healing-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const file=join(directory,'healing-cases.json');
  const kernel=await createExecutionKernel();
  const state=createCommerceState();
  const firstStore=new JsonFileHealingStore(file);
  const firstRuntime=new FlowRuntime(state,kernel.agents,new InMemoryEventBus(),kernel.graph,firstStore);
  const purchase:PurchaseInput={purchase_id:'persist-p1',supplier_id:'supplier-1',supplier_name:'Supplier',currency:'BRL',items:[{product_id:'beer',name:'Beer',quantity:5,unit_price:2}]};
  assert.equal((await firstRuntime.execute('purchase-products',purchase)).status,'Ok');
  const incomplete:SaleInput={sale_id:'persist-s1',currency:'BRL',items:[]};
  assert.equal((await firstRuntime.execute('process-sale',incomplete)).status,'Error');

  const initial=firstStore.listPending()[0];
  assert.ok(initial);
  assert.equal(initial.correlation_id,'ProcessSaleIntent:ResolveSaleProducts:persist-s1');

  const restartedStore=new JsonFileHealingStore(file);
  const restartedRuntime=new FlowRuntime(state,kernel.agents,new InMemoryEventBus(),kernel.graph,restartedStore);
  const api=new OperatorHealingApi(restartedRuntime,restartedStore);
  const pending=api.listPending();
  assert.equal(pending.length,1);
  assert.equal(pending[0]!.id,initial.id);
  assert.equal(pending[0]!.original_payload_hash,initial.original_payload_hash);
  assert.equal(pending[0]!.correlation_id,initial.correlation_id);
});

test('operator API delegates one-use resume to runtime and persists resolution audit', async t => {
  const directory=await mkdtemp(join(tmpdir(),'allascode-healing-resume-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const file=join(directory,'healing-cases.json');
  const kernel=await createExecutionKernel();
  const state=createCommerceState();
  const store=new JsonFileHealingStore(file);
  const runtime=new FlowRuntime(state,kernel.agents,new InMemoryEventBus(),kernel.graph,store);
  const purchase:PurchaseInput={purchase_id:'resume-p1',supplier_id:'supplier-1',supplier_name:'Supplier',currency:'BRL',items:[{product_id:'beer',name:'Beer',quantity:5,unit_price:2}]};
  assert.equal((await runtime.execute('purchase-products',purchase)).status,'Ok');
  assert.equal((await runtime.execute('process-sale',{sale_id:'resume-s1',currency:'BRL',items:[]} satisfies SaleInput)).status,'Error');

  const api=new OperatorHealingApi(runtime,store);
  const pending=api.listPending()[0]!;
  await assert.rejects(()=>api.submitResolution({case_id:pending.id,resume_token:'invalid',payload:{}}),/Invalid healing resume token/);
  assert.equal(api.listPending().length,1,'invalid token must not consume case');

  const report=await api.submitResolution({case_id:pending.id,resume_token:pending.resume_token,payload:{items:[{product_id:'beer',name:'Beer',quantity:2,unit_price:4}]}});
  assert.equal(report.status,'Ok');
  assert.equal(report.intent,'ProcessSaleIntent');
  assert.equal(report.last_event,'SaleCompleted');
  assert.equal(state.inventory.get('beer'),3);
  assert.equal(state.ledger.get('sale:resume-s1')?.amount,8);

  const afterRestart=new JsonFileHealingStore(file);
  assert.equal(afterRestart.listPending().length,0);
  assert.equal(afterRestart.get(pending.id)?.status,'resumed');
  assert.equal(afterRestart.get(pending.id)?.correlation_id,pending.correlation_id);
  assert.equal(afterRestart.auditLog().some(entry=>entry.case_id===pending.id&&entry.kind==='resolution'&&entry.detail.includes('Ok:SaleCompleted')),true);

  const restartedRuntime=new FlowRuntime(state,kernel.agents,new InMemoryEventBus(),kernel.graph,afterRestart);
  const restartedApi=new OperatorHealingApi(restartedRuntime,afterRestart);
  await assert.rejects(()=>restartedApi.submitResolution({case_id:pending.id,resume_token:pending.resume_token,payload:{}}),/already consumed/);
});
