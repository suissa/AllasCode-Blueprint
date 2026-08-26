import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SemanticGraph } from '../runtime/semantic-graph.js';

function missingActionEvidence(graph: SemanticGraph): string[] {
  const errors: string[] = [];
  const outgoing = (from: string, type: string) => graph.edges.filter(edge => edge.from === from && edge.type === type);

  for (const action of graph.nodes.filter(node => node.type === 'Action')) {
    const required = new Set([
      ...outgoing(action.id, 'PRESERVES').map(edge => edge.to),
      ...outgoing(action.id, 'GOVERNED_BY').map(edge => edge.to),
    ]);
    for (const target of required) {
      const proved = graph.edges.some(edge => {
        if (edge.type !== 'PROVES' || edge.to !== target) return false;
        const result = graph.nodes.find(node => node.id === edge.from && node.type === 'TestResult');
        if (!result || result.metadata?.status !== 'passed') return false;
        const producedBy = graph.edges.find(candidate => candidate.type === 'PRODUCES' && candidate.to === result.id)?.from;
        return Boolean(producedBy && graph.edges.some(candidate => candidate.type === 'TESTED_BY' && candidate.from === action.id && candidate.to === producedBy));
      });
      if (!proved) errors.push(`${action.id} lacks passed proof for ${target}`);
    }
  }
  return errors;
}

async function loadGraph(): Promise<SemanticGraph> {
  return JSON.parse(await readFile(join(import.meta.dirname, '..', 'generated', 'semantic-graph.json'), 'utf8')) as SemanticGraph;
}

test('every Action governance obligation has passed executable evidence', async () => {
  const graph = await loadGraph();
  assert.deepEqual(missingActionEvidence(graph), []);
});

test('mutation removing one semantic proof is rejected by evidence governance', async () => {
  const graph = structuredClone(await loadGraph());
  const proofIndex = graph.edges.findIndex(edge => edge.type === 'PROVES' && edge.to === 'Invariant:StockNonNegative');
  assert.notEqual(proofIndex, -1, 'canonical graph must contain a StockNonNegative proof');
  graph.edges.splice(proofIndex, 1);
  const errors = missingActionEvidence(graph);
  assert.ok(errors.some(error => error.includes('StockNonNegative')));
});
