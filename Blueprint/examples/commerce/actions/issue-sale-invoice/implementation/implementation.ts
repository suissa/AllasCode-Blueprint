import type { ActionImplementation, InvoiceInput, SaleInput } from '../../../runtime/types.js';

function fromEvent(payload: unknown): InvoiceInput | undefined {
  const invoice = payload as Partial<InvoiceInput>;
  if (invoice?.invoice_id && invoice.sale_id && typeof invoice.amount === 'number' && invoice.currency === 'BRL') return invoice as InvoiceInput;
  const sale = payload as Partial<SaleInput>;
  if (sale?.sale_id && sale.currency === 'BRL' && Array.isArray(sale.items)) {
    const amount = sale.items.reduce((total,item)=>total + item.quantity * item.unit_price, 0);
    return { invoice_id:`invoice:${sale.sale_id}`, sale_id:sale.sale_id, amount, currency:'BRL' };
  }
  return undefined;
}

export const issueSaleInvoice: ActionImplementation = {
  execute({ state, payload }) {
    const input = fromEvent(payload);
    if (!input || input.amount < 0) return { status:'Error', event:'SaleInvoiceIssueError', payload:{ message:'invalid sale-completed/invoice payload' } };
    const existing = state.invoices.get(input.invoice_id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(input)) return { status:'Error', event:'SaleInvoiceIssueError', payload:{ message:'invoice identity conflict' } };
    if (!existing) state.invoices.set(input.invoice_id, input);
    return { status:'Ok', event:'SaleInvoiceIssued', payload:input };
  }
};
