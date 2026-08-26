import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ActionRegistry } from './action-registry.js';
import { loadActionManifest } from './definition-loader.js';
import { registerPurchase } from '../actions/register-purchase/implementation/implementation.js';
import { increaseStock } from '../actions/increase-stock/implementation/implementation.js';
import { recordPurchaseExpense } from '../actions/record-purchase-expense/implementation/implementation.js';
import { resolveSaleProducts } from '../actions/resolve-sale-products/implementation/implementation.js';
import { decreaseStock } from '../actions/decrease-stock/implementation/implementation.js';
import { closeSale } from '../actions/close-sale/implementation/implementation.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

export async function createRegistry(): Promise<ActionRegistry> {
  const registry = new ActionRegistry();
  const definitions = [
    ['PurchaseAgent', 'register-purchase', registerPurchase],
    ['InventoryAgent', 'increase-stock', increaseStock],
    ['FinancialAgent', 'record-purchase-expense', recordPurchaseExpense],
    ['SalesAgent', 'resolve-sale-products', resolveSaleProducts],
    ['InventoryAgent', 'decrease-stock', decreaseStock],
    ['FinancialAgent', 'close-sale', closeSale],
  ] as const;

  for (const [agent, folder, implementation] of definitions) {
    const manifest = await loadActionManifest(join(root, 'actions', folder, 'manifest.yml'));
    registry.register(agent, manifest, implementation);
  }

  return registry;
}

export const commerceRoot = root;
