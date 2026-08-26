import type { CommerceState, ExecutionReport } from './types.js';
import type { SemanticGraph, SemanticGraphEdge } from './semantic-graph.js';
import { AgentRuntime } from './agent-runtime.js';
import { InMemoryEventBus } from './event-bus.js';
import { executeWithSemanticHealing } from './semantic-healing.js';

function label(id: string): string { const separator = id.indexOf(':'); return separator >= 0 ? id.slice(separator + 1) : id; }
function order(edge: SemanticGraphEdge): number { return Number(edge.metadata?.order ?? 0); }
function flowContract(graph: SemanticGraph, flowName: string): { intent: string; initialEvent: string; terminalEvent: string } {
  const flowId = `Flow:${flowName}`;
  if (!graph.nodes.some(node => node.id === flowId)) throw new Error(`Flow not found in Semantic Graph: ${flowName}`);
  const intentEdge = graph.edges.find(edge => edge.type === 'IMPLEMENTS_INTENT' && edge.from === flowId);
  if (!intentEdge) throw new Error(`Flow ${flowName} has no IMPLEMENTS_INTENT edge`);
  const initial = graph.edges.filter(edge => edge.type === 'FLOW_EMITS_EVENT' && edge.from === flowId).sort((a, b) => order(a) - order(b))[0];
  const terminal = graph.edges.filter(edge => edge.type === 'FLOW_EXPECTS_EVENT' && edge.from === flowId).sort((a, b) => order(a) - order(b)).at(-1);
  if (!initial) throw new Error(`Flow ${flowName} has no initial Event`);
  if (!terminal) throw new Error(`Flow ${flowName} has no terminal Event`);
  return { intent: label(intentEdge.to), initialEvent: label(initial.to), terminalEvent: label(terminal.to) };
}

export class FlowRuntime {
  constructor(private readonly state: CommerceState, private readonly agents: AgentRuntime, readonly events: InMemoryEventBus, private readonly graph: SemanticGraph) {}

  async execute(flowName: string, initialPayload: unknown): Promise<ExecutionReport> {
    const contract = flowContract(this.graph, flowName);
    const queue: Array<{ event: string; payload: unknown }> = [{ event: contract.initialEvent, payload: initialPayload }];
    let terminalPayload: unknown = initialPayload;
    let terminalSeen = false;
    let lastEvent: string | undefined;
    let transitions = 0;
    while (queue.length) {
      if (++transitions > 64) return { status: 'Error', intent: contract.intent, last_event: lastEvent, payload: { message: 'Event choreography exceeded 64 transitions; possible cycle' } };
      const message = queue.shift()!;
      this.events.emit(message.event, message.payload);
      lastEvent = message.event;
      if (message.event === contract.terminalEvent) { terminalSeen = true; terminalPayload = message.payload; continue; }
      const eventId = `Event:${message.event}`;
      const dispatches = this.graph.edges.filter(edge => edge.type === 'DISPATCHES' && edge.from === eventId);
      if (dispatches.length === 0) return { status: 'Error', intent: contract.intent, last_event: lastEvent, payload: { message: `No Agent listens to ${message.event}` } };
      for (const dispatch of dispatches) {
        const action = label(dispatch.to);
        const owner = this.graph.edges.find(edge => edge.type === 'ACTION_OWNER' && edge.from === dispatch.to);
        if (!owner) return { status: 'Error', intent: contract.intent, last_event: lastEvent, payload: { message: `Action ${action} has no owner` } };
        const agent = label(owner.to);
        if (!this.graph.edges.some(edge => edge.type === 'LISTENS' && edge.from === owner.to && edge.to === eventId)) continue;
        const context = { state: this.state, payload: message.payload };
        const healing = await executeWithSemanticHealing(
          this.graph,
          agent,
          action,
          () => Promise.resolve(this.agents.execute(agent, action, context)),
          (alternativeAgent, alternativeAction) => Promise.resolve(this.agents.execute(alternativeAgent, alternativeAction, context)),
        );
        const result = healing.result;
        if (result.status === 'Error') {
          this.events.emit(result.event, result.payload);
          return { status: 'Error', intent: contract.intent, last_event: result.event, payload: { ...result.payload, healing: healing.decision } };
        }
        queue.push({ event: result.event, payload: result.payload });
      }
    }
    if (!terminalSeen) return { status: 'Error', intent: contract.intent, last_event: lastEvent, payload: { message: `Flow ended without terminal Event ${contract.terminalEvent}` } };
    return { status: 'Ok', intent: contract.intent, last_event: contract.terminalEvent, payload: terminalPayload };
  }
}
