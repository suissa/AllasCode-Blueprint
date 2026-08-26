import type { ActionImplementation, AccountingEntryInput, InvoiceInput } from '../../../runtime/types.js';

function normalize(payload: unknown): AccountingEntryInput | undefined {
  const explicit = payload as Partial<AccountingEntryInput>;
  if (explicit?.accounting_entry_id) return explicit as AccountingEntryInput;
  const invoice = payload as Partial<InvoiceInput>;
  if (invoice?.invoice_id && invoice.sale_id && typeof invoice.amount === 'number' && invoice.currency === 'BRL') {
    return { accounting_entry_id: `invoice:${invoice.invoice_id}`, source_id: invoice.sale_id, source_type: 'invoice', debit: 0, credit: invoice.amount, currency: 'BRL' };
  }
  return undefined;
}

export const recordAccountingEffect: ActionImplementation = {
  execute({ state, payload }) {
    const input = normalize(payload);
    const valid = input?.accounting_entry_id && input.source_id && ['sale','purchase','invoice'].includes(input.source_type) && input.currency === 'BRL' && input.debit >= 0 && input.credit >= 0 && ((input.debit > 0) !== (input.credit > 0));
    if (!valid || !input) return { status:'Error', event:'AccountingEffectRecordError', payload:{ message:'invalid accounting entry' } };
    const existing = state.accounting_entries.get(input.accounting_entry_id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(input)) return { status:'Error', event:'AccountingEffectRecordError', payload:{ message:'accounting identity conflict' } };
    if (!existing) {
      state.accounting_entries.set(input.accounting_entry_id, input);
      const amount = input.debit > 0 ? input.debit : input.credit;
      state.ledger.set(`accounting:${input.accounting_entry_id}`, { id:`accounting:${input.accounting_entry_id}`, kind:input.debit > 0 ? 'accounting-debit' : 'accounting-credit', reference_id:input.source_id, amount, currency:input.currency });
    }
    return { status:'Ok', event:'AccountingEffectRecorded', payload:input };
  }
};
