import { join } from 'node:path';
import { createRegistry, commerceRoot } from './bootstrap.js';
import { InMemoryEventBus } from './event-bus.js';
import { FlowRuntime } from './flow-runtime.js';
import { createCommerceState, snapshot } from './state.js';
import type { PurchaseInput, SaleInput } from './types.js';

const state = createCommerceState();
const registry = await createRegistry();
const bus = new InMemoryEventBus();
const runtime = new FlowRuntime(state, registry, bus);

const purchase: PurchaseInput = {
  purchase_id: 'purchase-001',
  supplier_id: 'supplier-market-001',
  supplier_name: 'Local Market',
  currency: 'BRL',
  items: [
    { product_id: 'beer-350', name: 'Beer 350ml', quantity: 24, unit_price: 3.5 },
    { product_id: 'water-500', name: 'Water 500ml', quantity: 12, unit_price: 1.5 },
  ],
};

const purchaseResult = await runtime.execute(join(commerceRoot, 'flows', 'purchase-products.2flow'), purchase);
console.log('\nPURCHASE RESULT');
console.dir(purchaseResult, { depth: null });
console.log('\nSTATE AFTER PURCHASE');
console.dir(snapshot(state), { depth: null });

const sale: SaleInput = {
  sale_id: 'sale-001',
  currency: 'BRL',
  items: [
    { product_id: 'beer-350', name: 'Beer 350ml', quantity: 2, unit_price: 6 },
    { product_id: 'water-500', name: 'Water 500ml', quantity: 1, unit_price: 3 },
  ],
};

const saleResult = await runtime.execute(join(commerceRoot, 'flows', 'process-sale.2flow'), sale);
console.log('\nSALE RESULT');
console.dir(saleResult, { depth: null });
console.log('\nFINAL STATE');
console.dir(snapshot(state), { depth: null });
console.log('\nEVENT HISTORY');
console.dir(bus.history, { depth: null });
