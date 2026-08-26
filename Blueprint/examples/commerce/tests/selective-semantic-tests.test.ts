import test from 'node:test';
import assert from 'node:assert/strict';
import { createExecutionKernel } from '../runtime/execution-kernel.js';
import { analyzeSemanticImpact } from '../runtime/semantic-impact.js';
import { buildSelectiveTestPlan } from '../runtime/selective-semantic-tests.js';

const kernel = await createExecutionKernel();
const graph = kernel.graph;

test('Action impact partitions required tests into Action and architecture suites', () => {
  const impact = analyzeSemanticImpact(graph, ['Blueprint/examples/commerce/actions/decrease-stock/implementation/index.ts']);
  assert.ok(impact.required_tests.length > 0);
  const plan = buildSelectiveTestPlan(graph, impact.required_tests);
  assert.equal(plan.unmapped_tests.length, 0);
  assert.ok(plan.action_tests.length > 0, 'expected directly/indirectly impacted Action tests');
  assert.ok(plan.architecture_tests.length > 0, 'expected architecture tests from graph propagation');
  assert.deepEqual(plan.required_tests, [...new Set(impact.required_tests)].sort());
});

test('global semantic change selects a superset of local Action impact', () => {
  const local = buildSelectiveTestPlan(graph, analyzeSemanticImpact(graph, ['Blueprint/examples/commerce/actions/decrease-stock/implementation/index.ts']).required_tests);
  const global = buildSelectiveTestPlan(graph, analyzeSemanticImpact(graph, ['Blueprint/examples/commerce/governance/catalog.yml']).required_tests);
  assert.ok(global.required_tests.length >= local.required_tests.length);
  assert.equal(global.unmapped_tests.length, 0);
});
