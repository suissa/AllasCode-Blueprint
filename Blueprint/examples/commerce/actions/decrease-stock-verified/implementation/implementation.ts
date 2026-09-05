import type { ActionImplementation, SaleInput } from '../../../runtime/types.js';

export const decreaseStockVerified: ActionImplementation = {
  execute({ state, payload }) {
    const sale = payload as SaleInput;
    if (!sale?.sale_id || !Array.isArray(sale.items)) {
      return { status: 'Error', event: 'StockDecreaseError', payload: { message: 'SaleProductsResolved payload is required' } };
    }
    if (!state.applied_sale_stock.has(sale.sale_id)) {
      const movements = sale.items.map(item => ({
        product_id: item.product_id,
        quantity_removed: item.quantity,
        current: state.inventory.get(item.product_id) ?? 0,
      }));
      if (movements.some(movement => movement.current < movement.quantity_removed)) {
        return { status: 'Error', event: 'StockDecreaseError', payload: { message: 'Insufficient stock in verified path', details: movements } };
      }
      for (const movement of movements) {
        state.inventory.set(movement.product_id, movement.current - movement.quantity_removed);
      }
      state.applied_sale_stock.add(sale.sale_id);
    }
    return { status: 'Ok', event: 'StockDecreased', payload: sale };
  },
};
