import test from 'node:test';
import assert from 'node:assert/strict';
import { commerceRoot } from '../runtime/bootstrap.js';
import { compileSemanticGraph, validateSemanticGraph } from '../runtime/semantic-graph.js';
import { compileRuntimeSemanticGraph } from '../runtime/runtime-graph.js';

test('semantic graph compiles all executable architecture node types', async () => {
  const graph = await compileSemanticGraph(commerceRoot);
  assert.deepEqual(validateSemanticGraph(graph), []);
  const types = new Set(graph.nodes.map(node => node.type));
  for (const type of ['Entity', 'Intent', 'Event', 'Agent', 'Actor', 'Action', 'Tool', 'Flow']) {
    assert.equal(types.has(type as never), true, `missing ${type} node`);
  }
  assert.equal(graph.nodes.some(node => node.id === 'Flow:purchase-products'), true);
  assert.equal(graph.nodes.some(node => node.id === 'Flow:process-sale'), true);
  assert.equal(graph.nodes.some(node => node.id === 'Flow:sale-products'), false);
});

test('semantic graph encodes the Agent Actor Action path', async () => {
  const graph = await compileSemanticGraph(commerceRoot);
  const edge = (type: string, from: string, to: string) => graph.edges.some(candidate => candidate.type === type && candidate.from === from && candidate.to === to);
  assert.equal(edge('OWNS_ACTOR', 'Agent:InventoryAgent', 'Actor:InventoryActor'), true);
  assert.equal(edge('ALLOWS_ACTION', 'Agent:InventoryAgent', 'Action:DecreaseStock'), true);
  assert.equal(edge('ACCEPTS_ACTION', 'Actor:InventoryActor', 'Action:DecreaseStock'), true);
  assert.equal(edge('ACTION_OWNER', 'Action:DecreaseStock', 'Agent:InventoryAgent'), true);
});

test('runtime graph encodes event listeners instead of Agent-to-Agent calls', async () => {
  const graph = await compileRuntimeSemanticGraph(commerceRoot);
  const edge = (type: string, from: string, to: string) => graph.edges.some(candidate => candidate.type === type && candidate.from === from && candidate.to === to);
  assert.equal(edge('LISTENS', 'Agent:InventoryAgent', 'Event:PurchaseRegistered'), true);
  assert.equal(edge('DISPATCHES', 'Event:PurchaseRegistered', 'Action:IncreaseStock'), true);
  assert.equal(edge('LISTENS', 'Agent:FinancialAgent', 'Event:StockIncreased'), true);
  assert.equal(edge('DISPATCHES', 'Event:StockIncreased', 'Action:RecordPurchaseExpense'), true);
  assert.equal(graph.edges.some(candidate => candidate.type === 'CALLS_AGENT'), false);
});
