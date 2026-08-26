import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SemanticGraph } from '../runtime/semantic-graph.js';

const graphPath = join(import.meta.dirname, '..', 'generated', 'semantic-graph.json');
const graph = JSON.parse(await readFile(graphPath, 'utf8')) as SemanticGraph;
const errors: string[] = [];

function outgoing(from: string, type: string) {
  return graph.edges.filter(edge => edge.from === from && edge.type === type);
}

for (const action of graph.nodes.filter(node => node.type === 'Action')) {
  const required = [
    ...outgoing(action.id, 'PRESERVES').map(edge => edge.to),
    ...outgoing(action.id, 'GOVERNED_BY').map(edge => edge.to),
  ];

  for (const target of new Set(required)) {
    const proofExists = graph.edges.some(edge => {
      if (edge.type !== 'PROVES' || edge.to !== target) return false;
      const result = graph.nodes.find(node => node.id === edge.from && node.type === 'TestResult');
      if (!result || result.metadata?.status !== 'passed') return false;
      const testEdge = graph.edges.find(candidate => candidate.type === 'PRODUCES' && candidate.to === result.id);
      if (!testEdge) return false;
      return graph.edges.some(candidate => candidate.type === 'TESTED_BY' && candidate.from === action.id && candidate.to === testEdge.from);
    });
    if (!proofExists) errors.push(`${action.id} has no passed TestResult proving ${target}`);
  }
}

if (errors.length) throw new Error(`Semantic evidence gate rejected build:\n- ${errors.join('\n- ')}`);
console.log('Semantic evidence gate passed for all Action invariants and policies.');
