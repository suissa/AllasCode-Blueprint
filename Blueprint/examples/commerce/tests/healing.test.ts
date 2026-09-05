import test from 'node:test';
import assert from 'node:assert/strict';
import { createExecutionKernel } from '../runtime/execution-kernel.js';
import { diagnoseHealing, executeWithSemanticHealing, findSemanticFallback } from '../runtime/semantic-healing.js';
import { governSemanticGraph } from '../runtime/semantic-governor.js';
import { createCommerceState } from '../runtime/state.js';
import { FlowRuntime } from '../runtime/flow-runtime.js';
import { InMemoryEventBus } from '../runtime/event-bus.js';
import { InMemoryHealingStore } from '../runtime/healing-store.js';
import { applyReversibleNormalization } from '../healing/reversible-normalization.js';
import type { ActionResult, PurchaseInput, SaleInput } from '../runtime/types.js';

test('healing strategies are graph-declared instead of selected by Action name in runtime code', async () => {
  const kernel = await createExecutionKernel();
  const retry = kernel.graph.nodes.find(node => node.id === 'HealingStrategy:RetryTransientFailure');
  const human = kernel.graph.nodes.find(node => node.id === 'HealingStrategy:HumanMissingInformation');
  assert.equal(retry?.metadata?.kind, 'retry');
  assert.equal(human?.metadata?.kind, 'human');
  assert.equal(kernel.graph.edges.some(edge => edge.type === 'HEALED_BY' && edge.from === 'Action:DecreaseStock' && edge.to === retry?.id), true);
  assert.equal(kernel.graph.edges.some(edge => edge.type === 'HEALED_BY' && edge.from === 'Action:ResolveSaleProducts' && edge.to === human?.id), true);
});

test('transient Action failure obeys graph retry budget without transforming payload', async () => {
  const kernel = await createExecutionKernel();
  let calls = 0;
  const payload = { sale_id:'s1' };
  const execute = async (): Promise<ActionResult> => ++calls === 1
    ? { status: 'Error', event: 'StockDecreaseError', payload: { message: 'temporary unavailable' } }
    : { status: 'Ok', event: 'StockDecreased', payload };
  const outcome = await executeWithSemanticHealing(kernel.graph, 'InventoryAgent', 'DecreaseStock', execute);
  assert.equal(calls, 2);
  assert.equal(outcome.attempts, 2);
  assert.equal(outcome.result.status, 'Ok');
  assert.equal(outcome.healed, true);
  assert.equal(outcome.decision.kind, 'Retry');
  assert.deepEqual(outcome.result.payload, payload);
});

test('graph exposes explicit semantic equivalence, substitution and fallback', async () => {
  const kernel = await createExecutionKernel();
  const has = (type: string) => kernel.graph.edges.some(edge => edge.type === type && edge.from === 'Action:DecreaseStock' && edge.to === 'Action:DecreaseStockVerified');
  assert.equal(has('SEMANTICALLY_EQUIVALENT_TO'), true);
  assert.equal(has('SUBSTITUTABLE_BY'), true);
  assert.equal(has('FALLBACK_TO'), true);
  assert.deepEqual(findSemanticFallback(kernel.graph, 'DecreaseStock', { status: 'Error', event: 'StockDecreaseError', payload: { message: 'temporary unavailable' } }), { agent: 'InventoryAgent', action: 'DecreaseStockVerified' });
});

test('failed retry executes graph-declared fallback after the budget is exhausted', async () => {
  const kernel = await createExecutionKernel();
  let primaryCalls = 0;
  let alternativeCalls = 0;
  const store = new InMemoryHealingStore();
  const outcome = await executeWithSemanticHealing(
    kernel.graph,
    'InventoryAgent',
    'DecreaseStock',
    async () => { primaryCalls++; return { status: 'Error', event: 'StockDecreaseError', payload: { message: 'temporary unavailable' } }; },
    async (agent, action) => { alternativeCalls++; assert.equal(agent, 'InventoryAgent'); assert.equal(action, 'DecreaseStockVerified'); return { status: 'Ok', event: 'StockDecreased', payload: { sale_id: 's2' } }; },
    { store },
  );
  assert.equal(primaryCalls, 2);
  assert.equal(alternativeCalls, 1);
  assert.equal(outcome.result.status, 'Ok');
  assert.equal(outcome.healed, true);
  assert.equal(outcome.decision.kind, 'Alternative');
  assert.equal(store.auditLog().some(entry => entry.kind === 'retry'), true);
  assert.equal(store.auditLog().some(entry => entry.kind === 'fallback'), true);
});

test('retry timeout is read from graph strategy and can fall back safely', async () => {
  const kernel = await createExecutionKernel();
  const graph = structuredClone(kernel.graph);
  const strategy = graph.nodes.find(node => node.id === 'HealingStrategy:RetryTransientFailure');
  assert.ok(strategy);
  strategy.metadata = { ...strategy.metadata, timeout_ms: 5, backoff_ms: 0, max_attempts: 2 };
  let calls = 0;
  const outcome = await executeWithSemanticHealing(
    graph,
    'InventoryAgent',
    'DecreaseStock',
    async () => {
      calls++;
      if (calls === 1) return { status:'Error', event:'StockDecreaseError', payload:{ message:'temporary unavailable' } };
      return new Promise<ActionResult>(() => {});
    },
    async () => ({ status:'Ok', event:'StockDecreased', payload:{ sale_id:'timeout-fallback' } }),
  );
  assert.equal(outcome.result.status, 'Ok');
  assert.equal(outcome.decision.kind, 'Alternative');
});

test('Governor rejects a fallback that stops preserving source invariants', async () => {
  const kernel = await createExecutionKernel();
  const graph = structuredClone(kernel.graph);
  graph.edges = graph.edges.filter(edge => !(edge.type === 'PRESERVES' && edge.from === 'Action:DecreaseStockVerified' && edge.to === 'Invariant:StockNonNegative'));
  const decision = governSemanticGraph(graph);
  assert.equal(decision.allowed, false);
  assert.equal(decision.errors.some(error => error.includes('Invariants are not a superset')), true);
});

test('missing information escalates to an idempotent Human-in-the-Healing-Loop case', async () => {
  const kernel = await createExecutionKernel();
  const store = new InMemoryHealingStore();
  const error: ActionResult = { status:'Error', event:'SaleProductsResolutionError', payload:{ message:'required product evidence missing' } };
  const execute = async () => error;
  const context = { intent:'ProcessSaleIntent', original_event:'SaleIdentified', original_payload:{ sale_id:'sale-human', items:[] }, correlation_id:'sale-human', store };
  const first = await executeWithSemanticHealing(kernel.graph, 'SalesAgent', 'ResolveSaleProducts', execute, undefined, context);
  const second = await executeWithSemanticHealing(kernel.graph, 'SalesAgent', 'ResolveSaleProducts', execute, undefined, context);
  assert.equal(first.decision.kind, 'Human');
  assert.equal(second.decision.kind, 'Human');
  assert.equal(store.listPending().length, 1, 'same correlation/action must not create duplicate pending cases');
  const healingCase = store.listPending()[0]!;
  assert.equal(healingCase.intent, 'ProcessSaleIntent');
  assert.equal(healingCase.original_event, 'SaleIdentified');
  assert.equal(healingCase.original_payload_hash, store.hash({ sale_id:'sale-human', items:[] }));
  assert.equal(store.auditLog().filter(entry => entry.kind === 'human-escalation').length, 1);
});

test('FlowRuntime resumes the original intent from the failed Action without replaying previous effects', async () => {
  const state = createCommerceState();
  const kernel = await createExecutionKernel();
  const runtime = new FlowRuntime(state, kernel.agents, new InMemoryEventBus(), kernel.graph);
  const purchase: PurchaseInput = { purchase_id:'heal-p1', supplier_id:'supplier-1', supplier_name:'Supplier', currency:'BRL', items:[{ product_id:'beer', name:'Beer', quantity:5, unit_price:2 }] };
  assert.equal((await runtime.execute('purchase-products', purchase)).status, 'Ok');
  assert.equal(state.inventory.get('beer'), 5);

  const incomplete: SaleInput = { sale_id:'heal-s1', currency:'BRL', items:[] };
  const pending = await runtime.execute('process-sale', incomplete);
  assert.equal(pending.status, 'Error');
  const healingCase = runtime.healingStore.listPending()[0];
  assert.ok(healingCase);
  assert.equal(healingCase.intent, 'ProcessSaleIntent');

  const resumed = await runtime.resume(healingCase.id, healingCase.resume_token, { items:[{ product_id:'beer', name:'Beer', quantity:2, unit_price:4 }] });
  assert.equal(resumed.status, 'Ok');
  assert.equal(resumed.last_event, 'SaleCompleted');
  assert.equal(state.inventory.get('beer'), 3, 'stock must be decremented once after resume');
  assert.equal(state.ledger.get('sale:heal-s1')?.amount, 8);
  await assert.rejects(() => runtime.resume(healingCase.id, healingCase.resume_token, {}), /already consumed/);
});

test('reversible normalization is accepted only when reverse(forward(x)) restores x', () => {
  const reversible = applyReversibleNormalization('self-healing', {
    id:'TrimWithSuffixEvidence',
    forward(value:string){ const trimmed=value.trim(); return { trimmed, left:value.length-value.trimStart().length, right:value.length-value.trimEnd().length }; },
    reverse(value){ return `${' '.repeat(value.left)}${value.trimmed}${' '.repeat(value.right)}`; },
  }, '  beer  ');
  assert.equal(reversible.reversible, true);
  assert.equal(reversible.reversed, '  beer  ');

  assert.throws(() => applyReversibleNormalization('validation', {
    id:'IrreversibleLowercase',
    forward(value:string){ return value.toLowerCase(); },
    reverse(value:string){ return value; },
  }, 'Beer'), /not reversible/);
});

test('insufficient stock remains terminal because no matching healing strategy preserves it', async () => {
  const kernel = await createExecutionKernel();
  const decision = diagnoseHealing(kernel.graph, { agent: 'InventoryAgent', action: 'DecreaseStock', attempt: 0, error: { status: 'Error', event: 'StockDecreaseError', payload: { message: 'insufficient stock' } } });
  assert.equal(decision.kind, 'Terminal');
});
