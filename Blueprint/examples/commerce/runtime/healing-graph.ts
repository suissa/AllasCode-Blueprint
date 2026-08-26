import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { SemanticGraph } from './semantic-graph.js';

interface HealingStrategyDefinition {
  id: string;
  kind: 'retry' | 'human';
  applies_to: string[];
  message_regex: string;
  max_attempts?: number;
  timeout_ms?: number;
  backoff_ms?: number;
  resume_ttl_ms?: number;
  required_context?: string[];
}

export async function enrichHealingGraph(root: string, graph: SemanticGraph): Promise<SemanticGraph> {
  const document = parse(await readFile(join(root, 'healing', 'strategies.yml'), 'utf8')) as { strategies?: HealingStrategyDefinition[] };
  for (const strategy of document.strategies ?? []) {
    const strategyId = `HealingStrategy:${strategy.id}`;
    if (!graph.nodes.some(node => node.id === strategyId)) {
      graph.nodes.push({ id: strategyId, type: 'HealingStrategy', label: strategy.id, metadata: { kind: strategy.kind, message_regex: strategy.message_regex, max_attempts: strategy.max_attempts, timeout_ms: strategy.timeout_ms, backoff_ms: strategy.backoff_ms, resume_ttl_ms: strategy.resume_ttl_ms, required_context: strategy.required_context ?? [] } });
    }
    for (const action of strategy.applies_to) {
      const actionId = `Action:${action}`;
      if (!graph.nodes.some(node => node.id === actionId)) throw new Error(`Healing strategy ${strategy.id} references unknown ${actionId}`);
      if (!graph.edges.some(edge => edge.type === 'HEALED_BY' && edge.from === actionId && edge.to === strategyId)) {
        graph.edges.push({ id: `HEALED_BY:${actionId}->${strategyId}`, type: 'HEALED_BY', from: actionId, to: strategyId });
      }
    }
  }
  graph.nodes.sort((a,b)=>a.id.localeCompare(b.id));
  graph.edges.sort((a,b)=>a.id.localeCompare(b.id));
  return graph;
}
