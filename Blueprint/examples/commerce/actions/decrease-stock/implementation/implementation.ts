import type { ActionImplementation, SaleInput } from '../../../runtime/types.js';

export const decreaseStock: ActionImplementation = {
  execute({ state, payload }) {
    const sale = payload as SaleInput;
    if (!sale?.sale_id || !Array.isArray(sale.items)) {
      return { status: 'Error', event: 'StockDecreaseError', payload: { message: 'SaleProductsResolved payload is required' } };
    }
    if (!state.applied_sale_stock.has(sale.sale_id)) {
      for (const item of sale.items) {
        const current = state.inventory.get(item.product_id) ?? 0;
        if (current < item.quantity) {
          return { status: 'Error', event: 'StockDecreaseError', payload: { message: `Insufficient stock for ${item.product_id}`, details: { current, requested: item.quantity } } };
        }
      }
      for (const item of sale.items) {
        state.inventory.set(item.product_id, (state.inventory.get(item.product_id) ?? 0) - item.quantity);
      }
      state.applied_sale_stock.add(sale.sale_id);
    }
    return { status: 'Ok', event: 'StockDecreased', payload: sale };
  },
};
