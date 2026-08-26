import type { SemanticGraph, SemanticGraphNode } from './semantic-graph.js';
import type { ActionError, ActionResult } from './types.js';
import { InMemoryHealingStore, type HealingCase } from './healing-store.js';

export type HealingDecision =
  | { kind: 'Retry'; reason: string; strategy: string; max_attempts: number; timeout_ms: number; backoff_ms: number }
  | { kind: 'Alternative'; reason: string; agent: string; action: string; relation: 'FALLBACK_TO'; strategy?: string }
  | { kind: 'Human'; reason: string; strategy: string; required_context: string[]; resume_ttl_ms: number; case?: HealingCase }
  | { kind: 'Terminal'; reason: string };

export interface HealingContext { agent: string; action: string; error: ActionError; attempt: number; }
export interface HealingExecutionContext {
  intent?: string;
  original_event?: string;
  original_payload?: unknown;
  correlation_id?: string;
  store?: InMemoryHealingStore;
}
export interface HealingOutcome { result: ActionResult; healed: boolean; decision: HealingDecision; attempts: number; }

function label(id: string): string { const index = id.indexOf(':'); return index >= 0 ? id.slice(index + 1) : id; }
function hasEdge(graph: SemanticGraph, type: string, from: string): boolean { return graph.edges.some(edge => edge.type === type && edge.from === from); }
function strategyNodes(graph: SemanticGraph, action: string): SemanticGraphNode[] {
  const actionId = `Action:${action}`;
  const targets = new Set(graph.edges.filter(edge => edge.type === 'HEALED_BY' && edge.from === actionId).map(edge => edge.to));
  return graph.nodes.filter(node => targets.has(node.id) && node.type === 'HealingStrategy');
}
function matches(node: SemanticGraphNode, message: string): boolean {
  const source = String(node.metadata?.message_regex ?? '');
  if (!source) return false;
  return new RegExp(source, 'i').test(message);
}
function numberMeta(node: SemanticGraphNode, key: string, fallback: number): number {
  const value = Number(node.metadata?.[key]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
function stringArrayMeta(node: SemanticGraphNode, key: string): string[] {
  const value = node.metadata?.[key];
  return Array.isArray(value) ? value.map(String) : [];
}
function declaredErrorEvent(graph: SemanticGraph, action: string): string {
  const edge = graph.edges.find(candidate => candidate.type === 'EMITS_ERROR' && candidate.from === `Action:${action}`);
  return edge ? label(edge.to) : 'Error';
}

export function findSemanticFallback(graph: SemanticGraph, action: string, error: ActionError): { agent: string; action: string; strategy?: string } | undefined {
  const source = `Action:${action}`;
  const candidates = graph.edges.filter(edge => edge.type === 'FALLBACK_TO' && edge.from === source);
  for (const edge of candidates) {
    const strategyName = typeof edge.metadata?.when_strategy === 'string' ? edge.metadata.when_strategy : undefined;
    if (strategyName) {
      const strategy = graph.nodes.find(node => node.id === `HealingStrategy:${strategyName}` && node.type === 'HealingStrategy');
      const attached = graph.edges.some(candidate => candidate.type === 'HEALED_BY' && candidate.from === source && candidate.to === strategy?.id);
      if (!strategy || !attached || !matches(strategy, error.payload.message)) continue;
    }
    const owner = graph.edges.find(candidate => candidate.type === 'ACTION_OWNER' && candidate.from === edge.to)?.to;
    if (!owner) continue;
    return { agent: label(owner), action: label(edge.to), ...(strategyName ? { strategy: strategyName } : {}) };
  }
  return undefined;
}

export function diagnoseHealing(graph: SemanticGraph, context: HealingContext): HealingDecision {
  const actionId = `Action:${context.action}`;
  const message = context.error.payload.message;
  const strategies = strategyNodes(graph, context.action).filter(node => matches(node, message));

  const retry = strategies.find(node => node.metadata?.kind === 'retry');
  if (retry) {
    const maxAttempts = Math.max(1, numberMeta(retry, 'max_attempts', 1));
    if (context.attempt + 1 < maxAttempts) {
      return {
        kind: 'Retry',
        reason: `Graph strategy ${retry.label} matched the failure and preserves the same semantic request.`,
        strategy: retry.label,
        max_attempts: maxAttempts,
        timeout_ms: numberMeta(retry, 'timeout_ms', 1000),
        backoff_ms: numberMeta(retry, 'backoff_ms', 0),
      };
    }
  }

  const fallback = findSemanticFallback(graph, context.action, context.error);
  if (fallback) return { kind: 'Alternative', reason: 'Graph-declared fallback preserves the source Action semantic contract.', agent: fallback.agent, action: fallback.action, relation: 'FALLBACK_TO', strategy:fallback.strategy };

  const human = strategies.find(node => node.metadata?.kind === 'human');
  if (human) return {
    kind: 'Human',
    reason: `Graph strategy ${human.label} requires information that cannot be derived reversibly.`,
    strategy: human.label,
    required_context: stringArrayMeta(human, 'required_context'),
    resume_ttl_ms: numberMeta(human, 'resume_ttl_ms', 86_400_000),
  };

  if (hasEdge(graph, 'GOVERNED_BY', actionId) || hasEdge(graph, 'CONSTRAINED_BY', actionId) || hasEdge(graph, 'PRESERVES', actionId)) return { kind: 'Terminal', reason: 'No graph-declared reversible healing path preserves the Action governance obligations.' };
  return { kind: 'Terminal', reason: 'No reversible semantic healing strategy is declared.' };
}

async function executeBounded(execute: () => Promise<ActionResult>, timeoutMs: number, errorEvent: string): Promise<ActionResult> {
  if (timeoutMs <= 0) return execute();
  return Promise.race([
    execute(),
    new Promise<ActionResult>(resolve => setTimeout(() => resolve({ status:'Error', event:errorEvent, payload:{ message:`timeout after ${timeoutMs}ms during healing retry` } }), timeoutMs)),
  ]);
}
async function backoff(ms: number): Promise<void> { if (ms > 0) await new Promise(resolve => setTimeout(resolve, ms)); }

export async function executeWithSemanticHealing(
  graph: SemanticGraph,
  agent: string,
  action: string,
  execute: () => Promise<ActionResult>,
  executeAlternative?: (agent: string, action: string) => Promise<ActionResult>,
  executionContext: HealingExecutionContext = {},
): Promise<HealingOutcome> {
  const store = executionContext.store;
  const errorEvent = declaredErrorEvent(graph, action);
  let attempts = 1;
  let activeAgent = agent;
  let activeAction = action;
  store?.audit({ kind:'attempt', agent, action, detail:'Initial Action execution.' });
  let result = await execute();
  if (result.status === 'Ok') return { result, healed: false, decision: { kind: 'Terminal', reason: 'No healing required.' }, attempts };

  let decision = diagnoseHealing(graph, { agent, action, error: result, attempt: 0 });
  while (decision.kind === 'Retry' && attempts < decision.max_attempts) {
    store?.audit({ kind:'retry', agent:activeAgent, action:activeAction, detail:`${decision.strategy} attempt ${attempts + 1}/${decision.max_attempts}` });
    await backoff(decision.backoff_ms);
    attempts += 1;
    result = await executeBounded(execute, decision.timeout_ms, errorEvent);
    if (result.status === 'Ok') return { result, healed: true, decision, attempts };
    decision = diagnoseHealing(graph, { agent:activeAgent, action:activeAction, error:result, attempt:attempts - 1 });
  }

  if (decision.kind === 'Alternative' && executeAlternative) {
    store?.audit({ kind:'fallback', agent:activeAgent, action:activeAction, detail:`${activeAction} -> ${decision.action} via ${decision.strategy ?? 'FALLBACK_TO'}` });
    activeAgent = decision.agent;
    activeAction = decision.action;
    attempts += 1;
    const alternative = await executeAlternative(activeAgent, activeAction);
    if (alternative.status === 'Ok') return { result: alternative, healed: true, decision, attempts };
    result = alternative;
    decision = diagnoseHealing(graph, { agent:activeAgent, action:activeAction, error:alternative, attempt:0 });
  }

  if (decision.kind === 'Human' && store) {
    const correlation = executionContext.correlation_id ?? `${executionContext.intent ?? 'intent'}:${activeAction}:${store.hash(executionContext.original_payload)}`;
    const healingCase = store.escalate({
      intent: executionContext.intent ?? 'unknown-intent',
      agent: activeAgent,
      action: activeAction,
      original_event: executionContext.original_event ?? 'unknown-event',
      original_payload: executionContext.original_payload,
      error_event: result.event,
      error_message: result.payload.message,
      correlation_id: correlation,
    }, decision.resume_ttl_ms);
    return { result, healed: false, decision: { ...decision, case: healingCase }, attempts };
  }

  store?.audit({ kind:'terminal', agent:activeAgent, action:activeAction, detail:result.payload.message });
  return { result, healed: false, decision, attempts };
}

export async function resumeHumanHealing(
  store: InMemoryHealingStore,
  caseId: string,
  resumeToken: string,
  executeOriginal: (healingCase: HealingCase, humanPayload: unknown) => Promise<ActionResult>,
  humanPayload: unknown,
): Promise<ActionResult> {
  const healingCase = store.consumeResume(caseId, resumeToken);
  return executeOriginal(healingCase, humanPayload);
}
