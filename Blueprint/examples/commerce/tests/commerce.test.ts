import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommerceRuntime, createCommerceState } from '../runtime/commerce-runtime.js';
import { createExecutionKernel } from '../runtime/execution-kernel.js';

test('purchase then sale preserves inventory and financial invariants through graph-projected agents and actors', async () => {
  const state = createCommerceState();
  const runtime = await createCommerceRuntime(state);
  const purchase = {
    purchase_id: 'purchase-1',
    supplier_id: 'supplier-1',
    total: 10,
    items: [{ product_id: 'beer', name: 'Beer', quantity: 2, unit_price: 5 }],
  };
  const purchaseResult = await runtime.execute('purchase-products', purchase);
  assert.equal(purchaseResult.status, 'Ok');
  assert.equal(state.inventory.get('beer'), 2);
  assert.equal(state.financial.length, 1);
  const sale = {
    sale_id: 'sale-1',
    amount: 6,
    identified_at: new Date().toISOString(),
    items: [{ product_id: 'beer', name: 'Beer', quantity: 1, unit_price: 6 }],
  };
  const saleResult = await runtime.execute('process-sale', sale);
  assert.equal(saleResult.status, 'Ok');
  assert.equal(state.inventory.get('beer'), 1);
  assert.equal(state.financial.length, 2);
});

test('sale cannot make stock negative through graph-projected routing', async () => {
  const state = createCommerceState();
  const runtime = await createCommerceRuntime(state);
  const sale = {
    sale_id: 'sale-negative',
    amount: 6,
    identified_at: new Date().toISOString(),
    items: [{ product_id: 'beer', name: 'Beer', quantity: 1, unit_price: 6 }],
  };
  const result = await runtime.execute('process-sale', sale);
  assert.equal(result.status, 'Error');
  assert.equal(state.inventory.get('beer') ?? 0, 0);
});

test('runtime topology is projected from compiled graph', async () => {
  const kernel = await createExecutionKernel();
  assert.equal(kernel.projection.agents.length, 7);
  assert.equal(kernel.projection.actors.length, 7);
  assert.equal(kernel.projection.actions.length, 11);
  assert.equal(kernel.projection.tools.length, 3);
  const inventory = kernel.projection.agents.find(agent => agent.name === 'InventoryAgent');
  assert.equal(inventory?.actor, 'InventoryActor');
  assert.deepEqual(inventory?.actions, ['DecreaseStock', 'DecreaseStockVerified', 'IncreaseStock']);
});
