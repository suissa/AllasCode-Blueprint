import test from 'node:test';
import assert from 'node:assert/strict';
import { createExecutionKernel } from '../runtime/execution-kernel.js';
import { InMemoryEventBus } from '../runtime/event-bus.js';
import { FlowRuntime } from '../runtime/flow-runtime.js';
import { createCommerceState } from '../runtime/state.js';
import type { PurchaseInput, SaleInput } from '../runtime/types.js';

test('purchase then sale preserves inventory and financial invariants through graph-projected agents and actors', async () => {
  const state = createCommerceState();
  const kernel = await createExecutionKernel();
  const runtime = new FlowRuntime(state, kernel.agents, new InMemoryEventBus(), kernel.graph);

  const purchase: PurchaseInput = {
    purchase_id: 'p1', supplier_id: 's1', supplier_name: 'Supplier', currency: 'BRL',
    items: [{ product_id: 'beer', name: 'Beer', quantity: 10, unit_price: 3 }],
  };
  const sale: SaleInput = {
    sale_id: 'v1', currency: 'BRL',
    items: [{ product_id: 'beer', name: 'Beer', quantity: 2, unit_price: 6 }],
  };

  const purchaseResult = await runtime.execute('purchase-products', purchase);
  assert.equal(purchaseResult.status, 'Ok');
  assert.equal(state.inventory.get('beer'), 10);
  assert.equal(state.ledger.get('purchase:p1')?.amount, 30);

  const saleResult = await runtime.execute('process-sale', sale);
  assert.equal(saleResult.status, 'Ok');
  assert.equal(state.inventory.get('beer'), 8);
  assert.equal(state.ledger.get('sale:v1')?.amount, 12);
});

test('sale cannot make stock negative through graph-projected routing', async () => {
  const state = createCommerceState();
  const kernel = await createExecutionKernel();
  const runtime = new FlowRuntime(state, kernel.agents, new InMemoryEventBus(), kernel.graph);
  const sale: SaleInput = {
    sale_id: 'v2', currency: 'BRL',
    items: [{ product_id: 'beer', name: 'Beer', quantity: 1, unit_price: 6 }],
  };
  const result = await runtime.execute('process-sale', sale);
  assert.equal(result.status, 'Error');
  assert.equal(state.inventory.get('beer') ?? 0, 0);
});

test('runtime topology is projected from compiled graph', async () => {
  const kernel = await createExecutionKernel();
  assert.equal(kernel.projection.agents.length, 4);
  assert.equal(kernel.projection.actors.length, 4);
  assert.equal(kernel.projection.actions.length, 7);
  assert.equal(kernel.projection.tools.length, 3);
  const inventory = kernel.projection.agents.find(agent => agent.name === 'InventoryAgent');
  assert.equal(inventory?.actor, 'InventoryActor');
  assert.deepEqual(inventory?.actions, ['DecreaseStock', 'DecreaseStockVerified', 'IncreaseStock']);
});
