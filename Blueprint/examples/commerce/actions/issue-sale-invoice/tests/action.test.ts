import { join } from 'node:path';
import { defineActionTests } from '../../../tests/action-harness.js';
import { issueSaleInvoice } from '../implementation/implementation.js';
const actionDir=join(import.meta.dirname,'..');
defineActionTests({name:'IssueSaleInvoice',manifest:{name:'IssueSaleInvoice',semantic_id:'commerce.action.issue-sale-invoice',results:{Ok:'SaleInvoiceIssued',Error:'SaleInvoiceIssueError'}},implementation:issueSaleInvoice,actionDir,valid(index=0){return{invoice_id:`invoice-${index}`,sale_id:`sale-${index}`,amount:10+index,currency:'BRL' as const};},invalid(){return{};},setup(state,payload){state.sales.set(payload.sale_id,{sale_id:payload.sale_id,currency:'BRL',items:[]});},assertEffect(state,payload){if(!state.invoices.has(payload.invoice_id))throw new Error('invoice not issued');}});
