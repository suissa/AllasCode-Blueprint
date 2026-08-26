import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { SemanticGraph } from './semantic-graph.js';

interface HealingConfig {
  retry?: { max_attempts?: number; timeout_ms?: number; backoff_ms?: number };
  human?: { resume_ttl_ms?: number };
  normalization?: { allowed_in?: string[]; reversible_required?: boolean };
  audit?: { enabled?: boolean; payload_hash?: string };
}
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
  const [config, document] = await Promise.all([
    readFile(join(root, 'healing', 'config.yml'), 'utf8').then(value => parse(value) as HealingConfig),
    readFile(join(root, 'healing', 'strategies.yml'), 'utf8').then(value => parse(value) as { strategies?: HealingStrategyDefinition[] }),
  ]);
  if (config.normalization?.reversible_required !== true) throw new Error('Healing normalization must require reversibility');
  const allowed = new Set(config.normalization?.allowed_in ?? []);
  if (!allowed.has('validation') || !allowed.has('self-healing') || allowed.size !== 2) throw new Error('Normalization is allowed only in validation and self-healing');

  const capabilityId = 'RuntimeCapability:SemanticHealing';
  if (!graph.nodes.some(node => node.id === capabilityId)) graph.nodes.push({ id: capabilityId, type:'RuntimeCapability', label:'SemanticHealing', metadata:{ audit:config.audit ?? {}, normalization:config.normalization ?? {} } });

  for (const strategy of document.strategies ?? []) {
    const strategyId = `HealingStrategy:${strategy.id}`;
    const metadata = strategy.kind === 'retry'
      ? {
          kind: strategy.kind,
          message_regex: strategy.message_regex,
          max_attempts: strategy.max_attempts ?? config.retry?.max_attempts ?? 1,
          timeout_ms: strategy.timeout_ms ?? config.retry?.timeout_ms ?? 1000,
          backoff_ms: strategy.backoff_ms ?? config.retry?.backoff_ms ?? 0,
          required_context: [],
        }
      : {
          kind: strategy.kind,
          message_regex: strategy.message_regex,
          resume_ttl_ms: strategy.resume_ttl_ms ?? config.human?.resume_ttl_ms ?? 86_400_000,
          required_context: strategy.required_context ?? [],
        };
    if (!graph.nodes.some(node => node.id === strategyId)) graph.nodes.push({ id: strategyId, type: 'HealingStrategy', label: strategy.id, metadata });
    if (!graph.edges.some(edge => edge.type === 'IMPLEMENTS_HEALING' && edge.from === strategyId && edge.to === capabilityId)) graph.edges.push({ id:`IMPLEMENTS_HEALING:${strategyId}->${capabilityId}`, type:'IMPLEMENTS_HEALING', from:strategyId, to:capabilityId });
    for (const action of strategy.applies_to) {
      const actionId = `Action:${action}`;
      if (!graph.nodes.some(node => node.id === actionId)) throw new Error(`Healing strategy ${strategy.id} references unknown ${actionId}`);
      if (!graph.edges.some(edge => edge.type === 'HEALED_BY' && edge.from === actionId && edge.to === strategyId)) graph.edges.push({ id: `HEALED_BY:${actionId}->${strategyId}`, type: 'HEALED_BY', from: actionId, to: strategyId });
    }
  }
  graph.nodes.sort((a,b)=>a.id.localeCompare(b.id));
  graph.edges.sort((a,b)=>a.id.localeCompare(b.id));
  return graph;
}
