import type { ActionImplementation, PurchaseInput } from '../../../runtime/types.js';

export const increaseStock: ActionImplementation = {
  execute({ state, payload }) {
    const purchase = payload as PurchaseInput;
    if (!purchase?.purchase_id || !Array.isArray(purchase.items)) {
      return { status: 'Error', event: 'StockIncreaseError', payload: { message: 'PurchaseRegistered payload is required' } };
    }
    if (!state.applied_purchase_stock.has(purchase.purchase_id)) {
      for (const item of purchase.items) {
        state.inventory.set(item.product_id, (state.inventory.get(item.product_id) ?? 0) + item.quantity);
      }
      state.applied_purchase_stock.add(purchase.purchase_id);
    }
    return { status: 'Ok', event: 'StockIncreased', payload: purchase };
  },
};
