import type { ActionImplementation, PurchaseInput } from '../../../runtime/types.js';

function isPurchase(value: unknown): value is PurchaseInput {
  if (!value || typeof value !== 'object') return false;
  const purchase = value as PurchaseInput;
  return Boolean(purchase.purchase_id && purchase.supplier_id && purchase.currency === 'BRL' && Array.isArray(purchase.items));
}

export const registerPurchase: ActionImplementation = {
  execute({ state, payload }) {
    if (!isPurchase(payload) || payload.items.length === 0) {
      return { status: 'Error', event: 'PurchaseRegistrationError', payload: { message: 'Invalid purchase payload' } };
    }
    if (payload.items.some(item => item.quantity <= 0 || item.unit_price < 0)) {
      return { status: 'Error', event: 'PurchaseRegistrationError', payload: { message: 'Purchase items must have positive quantity and non-negative price' } };
    }
    const existing = state.purchases.get(payload.purchase_id);
    const purchase = existing ?? payload;
    state.purchases.set(purchase.purchase_id, purchase);
    return { status: 'Ok', event: 'PurchaseRegistered', payload: purchase };
  },
};
