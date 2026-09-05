import type { ActionImplementation, PurchaseInput } from '../../../runtime/types.js';

export const recordPurchaseExpense: ActionImplementation = {
  execute({ state, payload }) {
    const purchase = payload as PurchaseInput;
    if (!purchase?.purchase_id || !Array.isArray(purchase.items)) {
      return { status: 'Error', event: 'PurchaseExpenseRecordingError', payload: { message: 'StockIncreased payload is required' } };
    }
    const id = `purchase:${purchase.purchase_id}`;
    if (!state.ledger.has(id)) {
      const amount = purchase.items.reduce((total, item) => total + item.quantity * item.unit_price, 0);
      state.ledger.set(id, { id, kind: 'purchase-expense', reference_id: purchase.purchase_id, amount, currency: purchase.currency });
    }
    return { status: 'Ok', event: 'PurchaseCompleted', payload: purchase };
  },
};
