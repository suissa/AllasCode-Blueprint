export type Currency = 'BRL';

export interface CommerceItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface PurchaseInput {
  purchase_id: string;
  supplier_id: string;
  supplier_name: string;
  currency: Currency;
  items: CommerceItem[];
}

export interface SaleInput {
  sale_id: string;
  currency: Currency;
  items: CommerceItem[];
  customer_id?: string;
  operator_id?: string;
}

export interface UserInput { user_id: string; status: 'active' | 'suspended' | 'disabled'; }
export interface CustomerSaleInput { sale_id: string; customer_id: string; }
export interface InvoiceInput { invoice_id: string; sale_id: string; amount: number; currency: Currency; }
export interface AccountingEntryInput { accounting_entry_id: string; source_id: string; source_type: 'sale' | 'purchase' | 'invoice'; debit: number; credit: number; currency: Currency; }

export interface LedgerEntry {
  id: string;
  kind: 'purchase-expense' | 'sale-revenue' | 'accounting-debit' | 'accounting-credit';
  reference_id: string;
  amount: number;
  currency: Currency;
}

export interface CommerceState {
  inventory: Map<string, number>;
  purchases: Map<string, PurchaseInput>;
  sales: Map<string, SaleInput>;
  ledger: Map<string, LedgerEntry>;
  users: Map<string, UserInput>;
  invoices: Map<string, InvoiceInput>;
  accounting_entries: Map<string, AccountingEntryInput>;
  applied_purchase_stock: Set<string>;
  applied_sale_stock: Set<string>;
}

export interface ActionContext { state: CommerceState; payload: unknown; }
export type ActionOk = { status: 'Ok'; event: string; payload: unknown };
export type ActionError = { status: 'Error'; event: string; payload: { message: string; details?: unknown } };
export type ActionResult = ActionOk | ActionError;
export interface ActionImplementation { execute(context: ActionContext): Promise<ActionResult> | ActionResult; }
export interface ActionManifest { name: string; semantic_id: string; canonical_label?: string; validation?: Record<string, unknown>; results: { Ok: string; Error: string }; }
export interface ExecutionReport { status: 'Ok' | 'Error'; intent: string; last_event: string | undefined; payload: unknown; }
