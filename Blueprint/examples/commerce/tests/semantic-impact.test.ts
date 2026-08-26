import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SemanticGraph } from '../runtime/semantic-graph.js';
import { analyzeSemanticImpact, mapChangedFilesToSeeds } from '../runtime/semantic-impact.js';

const graph = JSON.parse(await readFile(join(import.meta.dirname,'..','generated','semantic-graph.json'),'utf8')) as SemanticGraph;

test('maps an Action implementation change to its Action node', () => {
  const seeds = mapChangedFilesToSeeds(graph,['Blueprint/examples/commerce/actions/decrease-stock/implementation/index.ts']);
  assert.ok(seeds.includes('Action:DecreaseStock'));
});

test('propagates an Action change to related architecture and required semantic tests', () => {
  const report = analyzeSemanticImpact(graph,['Blueprint/examples/commerce/actions/decrease-stock/implementation/index.ts']);
  assert.ok(report.impacted_nodes.includes('Action:DecreaseStock'));
  assert.ok(report.impacted_nodes.some(id=>id.startsWith('Agent:InventoryAgent')));
  assert.ok(report.required_tests.length > 0);
  assert.ok(['MEDIUM','HIGH','CRITICAL'].includes(report.risk));
});

test('governance changes are treated as global high-risk semantic impact', () => {
  const report = analyzeSemanticImpact(graph,['Blueprint/examples/commerce/governance/catalog.yml']);
  assert.ok(report.seed_nodes.length > 10);
  assert.ok(['HIGH','CRITICAL'].includes(report.risk));
});
