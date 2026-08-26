import type { SemanticGraph } from './semantic-graph.js';
import type { ActionError, ActionResult } from './types.js';

export type HealingDecision =
  | { kind: 'Retry'; reason: string }
  | { kind: 'Human'; reason: string; required_context: string[] }
  | { kind: 'Terminal'; reason: string };

export interface HealingContext {
  agent: string;
  action: string;
  error: ActionError;
  attempt: number;
}

function hasEdge(graph: SemanticGraph, type: string, from: string): boolean {
  return graph.edges.some(edge => edge.type === type && edge.from === from);
}

/**
 * Semantic healing does not mutate payloads blindly and does not cross Context boundaries.
 * It asks the compiled graph which governance obligations surround the failed Action and
 * chooses only reversible strategies. A production runtime can replace this policy with
 * richer graph queries without changing Action implementations.
 */
export function diagnoseHealing(graph: SemanticGraph, context: HealingContext): HealingDecision {
  const actionId = `Action:${context.action}`;
  const message = context.error.payload.message.toLowerCase();

  const governed = hasEdge(graph, 'GOVERNED_BY', actionId);
  const constrained = hasEdge(graph, 'CONSTRAINED_BY', actionId);
  const preserves = hasEdge(graph, 'PRESERVES', actionId);

  // Transient failures are safe to retry once because no semantic transformation is applied.
  if (context.attempt === 0 && /transient|timeout|temporar|unavailable|busy/.test(message)) {
    return { kind: 'Retry', reason: 'Transient failure; retry preserves the same semantic request.' };
  }

  // Missing/ambiguous information cannot be invented. Escalate to a human with the original payload.
  if (/missing|required|ambiguous|unknown|resolve|identify|evidence/.test(message)) {
    return {
      kind: 'Human',
      reason: 'The Action requires information that cannot be derived reversibly.',
      required_context: ['original-event', 'action-error', 'action-governance'],
    };
  }

  // Governance-sensitive failures must remain terminal unless an explicit reversible strategy exists.
  if (governed || constrained || preserves) {
    return {
      kind: 'Terminal',
      reason: 'No graph-declared reversible healing path preserves the Action governance obligations.',
    };
  }

  return { kind: 'Terminal', reason: 'No reversible semantic healing strategy is declared.' };
}

export interface HealingOutcome {
  result: ActionResult;
  healed: boolean;
  decision: HealingDecision;
}

export async function executeWithSemanticHealing(
  graph: SemanticGraph,
  agent: string,
  action: string,
  execute: () => Promise<ActionResult>,
): Promise<HealingOutcome> {
  let result = await execute();
  if (result.status === 'Ok') {
    return { result, healed: false, decision: { kind: 'Terminal', reason: 'No healing required.' } };
  }

  let decision = diagnoseHealing(graph, { agent, action, error: result, attempt: 0 });
  if (decision.kind === 'Retry') {
    result = await execute();
    if (result.status === 'Ok') return { result, healed: true, decision };
    decision = diagnoseHealing(graph, { agent, action, error: result, attempt: 1 });
  }

  return { result, healed: false, decision };
}
