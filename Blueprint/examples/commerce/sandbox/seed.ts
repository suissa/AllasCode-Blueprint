import type { CommerceState, PurchaseInput, SaleInput } from '../runtime/types.js';
import { createCommerceState } from '../runtime/state.js';

export const SANDBOX_SEED_VERSION = 'v1';

export function createDeterministicSandboxState(): CommerceState {
  const state = createCommerceState();
  state.inventory.set('beer-350', 48);
  state.inventory.set('water-500', 36);
  state.inventory.set('soda-350', 24);
  state.users.set('customer-001', { user_id: 'customer-001', status: 'active' });
  state.users.set('operator-001', { user_id: 'operator-001', status: 'active' });

  const purchase: PurchaseInput = {
    purchase_id: 'seed-purchase-001', supplier_id: 'supplier-market-001', supplier_name: 'Mercado Sandbox', currency: 'BRL',
    items: [{ product_id: 'beer-350', name: 'Beer 350ml', quantity: 24, unit_price: 3.5 }],
  };
  const sale: SaleInput = {
    sale_id: 'seed-sale-001', currency: 'BRL', customer_id: 'customer-001', operator_id: 'operator-001',
    items: [{ product_id: 'water-500', name: 'Water 500ml', quantity: 2, unit_price: 3 }],
  };
  state.purchases.set(purchase.purchase_id, purchase);
  state.sales.set(sale.sale_id, sale);
  state.ledger.set('seed-expense-001', { id: 'seed-expense-001', kind: 'purchase-expense', reference_id: purchase.purchase_id, amount: 84, currency: 'BRL' });
  state.ledger.set('seed-revenue-001', { id: 'seed-revenue-001', kind: 'sale-revenue', reference_id: sale.sale_id, amount: 6, currency: 'BRL' });
  return state;
}

export function resetSandboxState(): CommerceState { return createDeterministicSandboxState(); }
