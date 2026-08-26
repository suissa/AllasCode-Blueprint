import assert from 'node:assert/strict';
import test from 'node:test';
import { createExecutionKernel } from '../runtime/execution-kernel.js';
import { createCommerceState } from '../runtime/state.js';

test('agent delegates action through its actor', async () => {
  const kernel = await createExecutionKernel();
  const state = createCommerceState();
  const result = await kernel.agents.execute('PurchaseAgent', 'RegisterPurchase', {
    state,
    payload: {
      purchase_id: 'p-agent-1', supplier_id: 's1', supplier_name: 'Supplier', currency: 'BRL',
      items: [{ product_id: 'beer-350', name: 'Beer 350ml', quantity: 2, unit_price: 3.5 }],
    },
  });
  assert.equal(result.status, 'Ok');
  assert.equal(result.event, 'PurchaseRegistered');
});

test('agent cannot use undeclared tool', async () => {
  const kernel = await createExecutionKernel();
  const result = await kernel.agents.useTool('FinancialAgent', 'ProductCatalogLookup', { product_id: 'beer-350' });
  assert.equal(result.status, 'Error');
  assert.equal(result.event, 'AgentToolDenied');
});

test('declared tool resolves product', async () => {
  const kernel = await createExecutionKernel();
  const result = await kernel.agents.useTool('SalesAgent', 'ProductCatalogLookup', { product_id: 'beer-350' });
  assert.equal(result.status, 'Ok');
  assert.equal(result.event, 'ProductResolved');
});
