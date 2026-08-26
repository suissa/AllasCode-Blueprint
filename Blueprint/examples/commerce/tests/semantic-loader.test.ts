import test from 'node:test';
import assert from 'node:assert/strict';
import { commerceRoot } from '../runtime/bootstrap.js';
import { loadSemanticArchitecture } from '../runtime/semantic-loader.js';

function names(values: Array<{ name: string }>): string[] {
  return values.map(value => value.name).sort();
}

test('runtime architecture is discovered from Blueprint definitions', async () => {
  const architecture = await loadSemanticArchitecture(commerceRoot);

  assert.deepEqual(names(architecture.agents), ['FinancialAgent', 'InventoryAgent', 'PurchaseAgent', 'SalesAgent']);
  assert.deepEqual(names(architecture.actors), ['FinancialActor', 'InventoryActor', 'PurchaseActor', 'SalesActor']);
  assert.deepEqual(names(architecture.tools), ['ProductCatalogLookup', 'PurchaseEvidenceReader', 'SaleTerminalReader']);
  assert.deepEqual(
    names(architecture.actions),
    ['CloseSale', 'DecreaseStock', 'IncreaseStock', 'RecordPurchaseExpense', 'RegisterPurchase', 'ResolveSaleProducts'],
  );

  const inventory = architecture.agents.find(agent => agent.name === 'InventoryAgent');
  assert.equal(inventory?.actor, 'InventoryActor');
  assert.deepEqual(inventory?.actions.sort(), ['DecreaseStock', 'IncreaseStock']);
});
