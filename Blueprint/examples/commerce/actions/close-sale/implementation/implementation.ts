import type { ActionImplementation, SaleInput } from '../../../runtime/types.js';

export const closeSale: ActionImplementation = {
  execute({ state, payload }) {
    const sale = payload as SaleInput;
    if (!sale?.sale_id || !state.applied_sale_stock.has(sale.sale_id)) {
      return { status: 'Error', event: 'SaleCloseError', payload: { message: 'Stock must be decreased before the sale can close' } };
    }
    const id = `sale:${sale.sale_id}`;
    if (!state.ledger.has(id)) {
      const amount = sale.items.reduce((total, item) => total + item.quantity * item.unit_price, 0);
      state.ledger.set(id, { id, kind: 'sale-revenue', reference_id: sale.sale_id, amount, currency: sale.currency });
      state.sales.set(sale.sale_id, sale);
    }
    return { status: 'Ok', event: 'SaleCompleted', payload: sale };
  },
};
