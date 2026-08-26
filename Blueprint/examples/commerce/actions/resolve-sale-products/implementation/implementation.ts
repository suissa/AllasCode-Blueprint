import type { ActionImplementation, SaleInput } from '../../../runtime/types.js';

export const resolveSaleProducts: ActionImplementation = {
  execute({ payload }) {
    const sale = payload as SaleInput;
    if (!sale?.sale_id || !Array.isArray(sale.items) || sale.items.length === 0) {
      return { status: 'Error', event: 'SaleProductsResolutionError', payload: { message: 'Sale must identify at least one product' } };
    }
    if (sale.items.some(item => item.quantity <= 0 || item.unit_price < 0)) {
      return { status: 'Error', event: 'SaleProductsResolutionError', payload: { message: 'Sale items are invalid' } };
    }
    return { status: 'Ok', event: 'SaleProductsResolved', payload: sale };
  },
};
