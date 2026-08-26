import test from 'node:test';
import assert from 'node:assert/strict';
import { commerceRoot } from '../runtime/bootstrap.js';
import { compileRuntimeSemanticGraph } from '../runtime/runtime-graph.js';
import { governSemanticGraph } from '../runtime/semantic-governor.js';
import type { SemanticGraph } from '../runtime/semantic-graph.js';

function clone(graph: SemanticGraph): SemanticGraph {
  return structuredClone(graph);
}

test('Semantic Governor accepts the canonical commerce graph', async () => {
  const graph = await compileRuntimeSemanticGraph(commerceRoot);
  const decision = governSemanticGraph(graph);
  assert.equal(decision.allowed, true, decision.errors.join('\n'));
});

test('startup governance rejects an Agent without Context binding', async () => {
  const graph = clone(await compileRuntimeSemanticGraph(commerceRoot));
  graph.edges = graph.edges.filter(edge => !(edge.type === 'BOUND_TO' && edge.from === 'Agent:InventoryAgent'));
  const decision = governSemanticGraph(graph);
  assert.equal(decision.allowed, false);
  assert.equal(decision.errors.some(error => error.includes('InventoryAgent') && error.includes('BOUND_TO')), true);
});

test('startup governance rejects an invariant without preserving Actions', async () => {
  const graph = clone(await compileRuntimeSemanticGraph(commerceRoot));
  graph.edges = graph.edges.filter(edge => !(edge.type === 'PRESERVES' && edge.to === 'Invariant:StockNonNegative'));
  const decision = governSemanticGraph(graph);
  assert.equal(decision.allowed, false);
  assert.equal(decision.errors.some(error => error.includes('StockNonNegative') && error.includes('preserved')), true);
});

test('startup governance rejects emitted Event without Schema', async () => {
  const graph = clone(await compileRuntimeSemanticGraph(commerceRoot));
  graph.edges = graph.edges.filter(edge => !(edge.type === 'VALIDATED_BY' && edge.from === 'Event:StockDecreased'));
  const decision = governSemanticGraph(graph);
  assert.equal(decision.allowed, false);
  assert.equal(decision.errors.some(error => error.includes('StockDecreased') && error.includes('Schema')), true);
});
