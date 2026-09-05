import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SemanticGraph } from '../runtime/semantic-graph.js';
import { computeSelectorConfidence, defaultSelectorScenarios } from '../runtime/selector-confidence.js';

const root = join(import.meta.dirname, '..');
const graph = JSON.parse(await readFile(join(root,'generated','semantic-graph.json'),'utf8')) as SemanticGraph;

test('selector confidence keeps 100% oracle recall across semantic mutation scenarios', () => {
  const report = computeSelectorConfidence(graph, defaultSelectorScenarios());
  assert.equal(report.passed, true);
  assert.equal(report.confidence_percent, 100);
  assert.ok(report.oracle_tests_total > 0);
  assert.ok(report.scenarios.length >= 8);
  for (const scenario of report.scenarios) {
    assert.equal(scenario.missed_tests.length, 0, `${scenario.name} missed required oracle tests`);
    assert.equal(scenario.recall_percent, 100);
  }
});
