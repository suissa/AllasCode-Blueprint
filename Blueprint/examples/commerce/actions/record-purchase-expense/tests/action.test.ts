import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { recordPurchaseExpense } from '../implementation/implementation.js';
import { defineActionTests } from '../../../tests/action-harness.js';
import type { ActionManifest, PurchaseInput } from '../../../runtime/types.js';

const actionDir = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = parse(readFileSync(join(actionDir, 'manifest.yml'), 'utf8')) as ActionManifest;
const purchase = (index = 0): PurchaseInput => ({ purchase_id: `purchase-expense-${index}`, supplier_id: 'supplier-1', supplier_name: 'Supplier', currency: 'BRL', items: [{ product_id: 'water', name: 'Water', quantity: 2, unit_price: 3.5 }] });

defineActionTests({
  name: manifest.name,
  manifest,
  implementation: recordPurchaseExpense,
  actionDir,
  valid: purchase,
  invalid: () => ({}),
  assertEffect: (state, payload) => { if (!state.ledger.has(`purchase:${payload.purchase_id}`)) throw new Error('Purchase expense was not recorded'); },
});
