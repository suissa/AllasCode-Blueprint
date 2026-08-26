import test from 'node:test';
import assert from 'node:assert/strict';
import { createExecutionKernel } from '../runtime/execution-kernel.js';
import { diagnoseHealing, executeWithSemanticHealing, findSemanticFallback } from '../runtime/semantic-healing.js';
import { governSemanticGraph } from '../runtime/semantic-governor.js';
import type { ActionResult } from '../runtime/types.js';

test('transient Action failure is retried once without transforming the payload', async () => {
  const kernel = await createExecutionKernel();
  let calls = 0;
  const execute = async (): Promise<ActionResult> => ++calls === 1 ? { status: 'Error', event: 'StockDecreaseError', payload: { message: 'temporary unavailable' } } : { status: 'Ok', event: 'StockDecreased', payload: { sale_id: 's1' } };
  const outcome = await executeWithSemanticHealing(kernel.graph, 'InventoryAgent', 'DecreaseStock', execute);
  assert.equal(calls, 2); assert.equal(outcome.result.status, 'Ok'); assert.equal(outcome.healed, true); assert.equal(outcome.decision.kind, 'Retry');
});

test('graph exposes explicit semantic equivalence, substitution and fallback', async () => {
  const kernel = await createExecutionKernel();
  const has = (type: string) => kernel.graph.edges.some(edge => edge.type === type && edge.from === 'Action:DecreaseStock' && edge.to === 'Action:DecreaseStockVerified');
  assert.equal(has('SEMANTICALLY_EQUIVALENT_TO'), true);
  assert.equal(has('SUBSTITUTABLE_BY'), true);
  assert.equal(has('FALLBACK_TO'), true);
  assert.deepEqual(findSemanticFallback(kernel.graph, 'DecreaseStock', { status: 'Error', event: 'StockDecreaseError', payload: { message: 'temporary unavailable' } }), { agent: 'InventoryAgent', action: 'DecreaseStockVerified' });
});

test('failed retry can execute the graph-declared fallback Action', async () => {
  const kernel = await createExecutionKernel();
  let primaryCalls = 0;
  let alternativeCalls = 0;
  const outcome = await executeWithSemanticHealing(
    kernel.graph,
    'InventoryAgent',
    'DecreaseStock',
    async () => { primaryCalls++; return { status: 'Error', event: 'StockDecreaseError', payload: { message: 'temporary unavailable' } }; },
    async (agent, action) => { alternativeCalls++; assert.equal(agent, 'InventoryAgent'); assert.equal(action, 'DecreaseStockVerified'); return { status: 'Ok', event: 'StockDecreased', payload: { sale_id: 's2' } }; },
  );
  assert.equal(primaryCalls, 2); assert.equal(alternativeCalls, 1); assert.equal(outcome.result.status, 'Ok'); assert.equal(outcome.healed, true); assert.equal(outcome.decision.kind, 'Alternative');
});

test('Governor rejects a fallback that stops preserving source invariants', async () => {
  const kernel = await createExecutionKernel();
  const graph = structuredClone(kernel.graph);
  graph.edges = graph.edges.filter(edge => !(edge.type === 'PRESERVES' && edge.from === 'Action:DecreaseStockVerified' && edge.to === 'Invariant:StockNonNegative'));
  const decision = governSemanticGraph(graph);
  assert.equal(decision.allowed, false);
  assert.equal(decision.errors.some(error => error.includes('Invariants are not a superset')), true);
});

test('missing information escalates to Human-in-the-Healing-Loop instead of inventing data', async () => {
  const kernel = await createExecutionKernel();
  const decision = diagnoseHealing(kernel.graph, { agent: 'SalesAgent', action: 'ResolveSaleProducts', attempt: 0, error: { status: 'Error', event: 'SaleProductsResolutionError', payload: { message: 'required product evidence missing' } } });
  assert.equal(decision.kind, 'Human');
});

test('insufficient stock remains terminal because fallback is only declared for transient failure', async () => {
  const kernel = await createExecutionKernel();
  const decision = diagnoseHealing(kernel.graph, { agent: 'InventoryAgent', action: 'DecreaseStock', attempt: 0, error: { status: 'Error', event: 'StockDecreaseError', payload: { message: 'insufficient stock' } } });
  assert.equal(decision.kind, 'Terminal');
});
