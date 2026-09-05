import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileRuntimeSemanticGraph } from '../runtime/runtime-graph.js';
import { compileSemanticTests } from '../runtime/test-graph.js';
import { governSemanticGraph } from '../runtime/semantic-governor.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('semantic test results become Test, TestResult and Metric nodes', async () => {
  const graph = await compileRuntimeSemanticGraph(root);
  const errors = await compileSemanticTests(root, graph);
  assert.deepEqual(errors, []);
  assert.ok(graph.nodes.some(node => node.type === 'Test'));
  assert.ok(graph.nodes.some(node => node.type === 'TestResult'));
  assert.ok(graph.nodes.some(node => node.type === 'Metric'));
  assert.ok(graph.edges.some(edge => edge.type === 'TESTED_BY'));
  assert.ok(graph.edges.some(edge => edge.type === 'PRODUCES'));
  assert.ok(graph.edges.some(edge => edge.type === 'MEASURES'));
  assert.equal(governSemanticGraph(graph).allowed, true);
});

test('Semantic Governor rejects malformed TestResult topology', async () => {
  const graph = await compileRuntimeSemanticGraph(root);
  await compileSemanticTests(root, graph);
  const edge = graph.edges.find(edge => edge.type === 'PRODUCES');
  assert.ok(edge);
  graph.edges = graph.edges.filter(candidate => candidate.id !== edge.id);
  const decision = governSemanticGraph(graph);
  assert.equal(decision.allowed, false);
  assert.ok(decision.errors.some(error => error.includes('must PRODUCE exactly one TestResult') || error.includes('must have exactly one PRODUCES source')));
});
