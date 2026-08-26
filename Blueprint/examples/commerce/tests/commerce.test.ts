import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { commerceRoot } from '../runtime/bootstrap.js';
import { createExecutionKernel } from '../runtime/execution-kernel.js';
import { InMemoryEventBus } from '../runtime/event-bus.js';
import { FlowRuntime } from '../runtime/flow-runtime.js';
import { createCommerceState } from '../runtime/state.js';
import type { PurchaseInput, SaleInput } from '../runtime/types.js';

test('purchase then sale preserves inventory and financial invariants through agents and actors', async () => {
  const state = createCommerceState();
  const kernel = await createExecutionKernel();
  const runtime = new FlowRuntime(state, kernel.agents, new InMemoryEventBus());

  const purchase: PurchaseInput = {
    purchase_id: 'p1', supplier_id: 's1', supplier_name: 'Supplier', currency: 'BRL',
    items: [{ product_id: 'beer', name: 'Beer', quantity: 10, unit_price: 3 }],
  };
  const sale: SaleInput = {
    sale_id: 'v1', currency: 'BRL',
    items: [{ product_id: 'beer', name: 'Beer', quantity: 2, unit_price: 6 }],
  };

  const purchaseResult = await runtime.execute(join(commerceRoot, 'flows', 'purchase-products.2flow'), purchase);
  assert.equal(purchaseResult.status, 'Ok');
  assert.equal(state.inventory.get('beer'), 10);
  assert.equal(state.ledger.get('purchase:p1')?.amount, 30);

  const saleResult = await runtime.execute(join(commerceRoot, 'flows', 'process-sale.2flow'), sale);
  assert.equal(saleResult.status, 'Ok');
  assert.equal(state.inventory.get('beer'), 8);
  assert.equal(state.ledger.get('sale:v1')?.amount, 12);
});

test('sale cannot make stock negative through agent and actor routing', async () => {
  const state = createCommerceState();
  const kernel = await createExecutionKernel();
  const runtime = new FlowRuntime(state, kernel.agents, new InMemoryEventBus());
  const sale: SaleInput = {
    sale_id: 'v2', currency: 'BRL',
    items: [{ product_id: 'beer', name: 'Beer', quantity: 1, unit_price: 6 }],
  };
  const result = await runtime.execute(join(commerceRoot, 'flows', 'process-sale.2flow'), sale);
  assert.equal(result.status, 'Error');
  assert.equal(state.inventory.get('beer') ?? 0, 0);
});
