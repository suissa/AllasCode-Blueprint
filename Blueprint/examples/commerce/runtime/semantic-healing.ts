import type { SemanticGraph } from './semantic-graph.js';
import type { ActionError, ActionResult } from './types.js';

export type HealingDecision =
  | { kind: 'Retry'; reason: string }
  | { kind: 'Alternative'; reason: string; agent: string; action: string; relation: 'FALLBACK_TO' }
  | { kind: 'Human'; reason: string; required_context: string[] }
  | { kind: 'Terminal'; reason: string };

export interface HealingContext { agent: string; action: string; error: ActionError; attempt: number; }
function label(id: string): string { const index = id.indexOf(':'); return index >= 0 ? id.slice(index + 1) : id; }
function hasEdge(graph: SemanticGraph, type: string, from: string): boolean { return graph.edges.some(edge => edge.type === type && edge.from === from); }
function isTransient(message: string): boolean { return /transient|timeout|temporar|unavailable|busy/.test(message); }

export function findSemanticFallback(graph: SemanticGraph, action: string, error: ActionError): { agent: string; action: string } | undefined {
  const source = `Action:${action}`;
  const message = error.payload.message.toLowerCase();
  const candidates = graph.edges.filter(edge => edge.type === 'FALLBACK_TO' && edge.from === source);
  for (const edge of candidates) {
    const conditions = Array.isArray(edge.metadata?.on) ? edge.metadata?.on as string[] : [];
    if (conditions.includes('transient') && !isTransient(message)) continue;
    const owner = graph.edges.find(candidate => candidate.type === 'ACTION_OWNER' && candidate.from === edge.to)?.to;
    if (!owner) continue;
    return { agent: label(owner), action: label(edge.to) };
  }
  return undefined;
}

export function diagnoseHealing(graph: SemanticGraph, context: HealingContext): HealingDecision {
  const actionId = `Action:${context.action}`;
  const message = context.error.payload.message.toLowerCase();
  if (context.attempt === 0 && isTransient(message)) return { kind: 'Retry', reason: 'Transient failure; retry preserves the same semantic request.' };
  const fallback = findSemanticFallback(graph, context.action, context.error);
  if (fallback) return { kind: 'Alternative', reason: 'Graph-declared fallback preserves the source Action semantic contract.', agent: fallback.agent, action: fallback.action, relation: 'FALLBACK_TO' };
  if (/missing|required|ambiguous|unknown|resolve|identify|evidence/.test(message)) return { kind: 'Human', reason: 'The Action requires information that cannot be derived reversibly.', required_context: ['original-event', 'action-error', 'action-governance'] };
  if (hasEdge(graph, 'GOVERNED_BY', actionId) || hasEdge(graph, 'CONSTRAINED_BY', actionId) || hasEdge(graph, 'PRESERVES', actionId)) return { kind: 'Terminal', reason: 'No graph-declared reversible healing path preserves the Action governance obligations.' };
  return { kind: 'Terminal', reason: 'No reversible semantic healing strategy is declared.' };
}

export interface HealingOutcome { result: ActionResult; healed: boolean; decision: HealingDecision; }

export async function executeWithSemanticHealing(
  graph: SemanticGraph,
  agent: string,
  action: string,
  execute: () => Promise<ActionResult>,
  executeAlternative?: (agent: string, action: string) => Promise<ActionResult>,
): Promise<HealingOutcome> {
  let result = await execute();
  if (result.status === 'Ok') return { result, healed: false, decision: { kind: 'Terminal', reason: 'No healing required.' } };

  let decision = diagnoseHealing(graph, { agent, action, error: result, attempt: 0 });
  if (decision.kind === 'Retry') {
    result = await execute();
    if (result.status === 'Ok') return { result, healed: true, decision };
    decision = diagnoseHealing(graph, { agent, action, error: result, attempt: 1 });
  }
  if (decision.kind === 'Alternative' && executeAlternative) {
    const alternative = await executeAlternative(decision.agent, decision.action);
    if (alternative.status === 'Ok') return { result: alternative, healed: true, decision };
    return { result: alternative, healed: false, decision: diagnoseHealing(graph, { agent: decision.agent, action: decision.action, error: alternative, attempt: 1 }) };
  }
  return { result, healed: false, decision };
}
