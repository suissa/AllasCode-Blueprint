import type { CommerceState } from './types.js';

export function createCommerceState(): CommerceState {
  return {
    inventory: new Map(),
    purchases: new Map(),
    sales: new Map(),
    ledger: new Map(),
    users: new Map(),
    invoices: new Map(),
    accounting_entries: new Map(),
    applied_purchase_stock: new Set(),
    applied_sale_stock: new Set(),
  };
}

export function snapshot(state: CommerceState) {
  return {
    inventory: Object.fromEntries(state.inventory),
    purchases: [...state.purchases.values()],
    sales: [...state.sales.values()],
    ledger: [...state.ledger.values()],
    users: [...state.users.values()],
    invoices: [...state.invoices.values()],
    accounting_entries: [...state.accounting_entries.values()],
  };
}
