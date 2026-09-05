import test from 'node:test';
import assert from 'node:assert/strict';
import { commerceRoot } from '../runtime/bootstrap.js';
import { loadSemanticArchitecture } from '../runtime/semantic-loader.js';
import { validateSemanticArchitecture } from '../runtime/semantic-validator.js';

test('commerce Blueprint is semantically consistent before execution', async () => {
  const architecture = await loadSemanticArchitecture(commerceRoot);
  const report = await validateSemanticArchitecture(commerceRoot, architecture);
  assert.equal(report.valid, true, report.errors.join('\n'));
  assert.deepEqual(report.entities, ['Financial', 'Inventory', 'Payment', 'Product', 'Purchase', 'Sale', 'Stock', 'Supplier']);
  assert.ok(report.intents.includes('PurchaseProductsIntent'));
  assert.ok(report.intents.includes('ProcessSaleIntent'));
  assert.ok(report.flows.includes('purchase-products.2flow'));
  assert.ok(report.flows.includes('process-sale.2flow'));
});
