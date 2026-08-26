import { ActorSystem } from './actor-system.js';
import { AgentRuntime } from './agent-runtime.js';
import { ToolRegistry } from './tool-registry.js';
import { createRegistry } from './bootstrap.js';
import { purchaseEvidenceReader } from '../tools/purchase-evidence-reader/implementation/implementation.js';
import { productCatalogLookup } from '../tools/product-catalog-lookup/implementation/implementation.js';
import { saleTerminalReader } from '../tools/sale-terminal-reader/implementation/implementation.js';

export async function createExecutionKernel() {
  const actions = await createRegistry();
  const tools = new ToolRegistry();
  tools.register('PurchaseEvidenceReader', 'PurchaseEvidenceRead', 'PurchaseEvidenceReadError', purchaseEvidenceReader);
  tools.register('ProductCatalogLookup', 'ProductResolved', 'ProductResolutionError', productCatalogLookup);
  tools.register('SaleTerminalReader', 'SaleTerminalRead', 'SaleTerminalReadError', saleTerminalReader);

  const actors = new ActorSystem(actions);
  actors.register({ name: 'PurchaseActor', agent: 'PurchaseAgent', actions: ['RegisterPurchase'], mailboxCapacity: 32 });
  actors.register({ name: 'InventoryActor', agent: 'InventoryAgent', actions: ['IncreaseStock', 'DecreaseStock'], mailboxCapacity: 64 });
  actors.register({ name: 'FinancialActor', agent: 'FinancialAgent', actions: ['RecordPurchaseExpense', 'CloseSale'], mailboxCapacity: 64 });
  actors.register({ name: 'SalesActor', agent: 'SalesAgent', actions: ['ResolveSaleProducts'], mailboxCapacity: 32 });

  const agents = new AgentRuntime(actors, tools);
  agents.register({ name: 'PurchaseAgent', actor: 'PurchaseActor', actions: ['RegisterPurchase'], tools: ['PurchaseEvidenceReader', 'ProductCatalogLookup'] });
  agents.register({ name: 'InventoryAgent', actor: 'InventoryActor', actions: ['IncreaseStock', 'DecreaseStock'], tools: ['ProductCatalogLookup'] });
  agents.register({ name: 'FinancialAgent', actor: 'FinancialActor', actions: ['RecordPurchaseExpense', 'CloseSale'], tools: [] });
  agents.register({ name: 'SalesAgent', actor: 'SalesActor', actions: ['ResolveSaleProducts'], tools: ['SaleTerminalReader', 'ProductCatalogLookup'] });

  return { actions, tools, actors, agents };
}
