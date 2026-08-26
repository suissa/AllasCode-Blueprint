import type { CommerceState, ExecutionReport } from './types.js';
import type { SemanticGraph, SemanticGraphEdge } from './semantic-graph.js';
import { AgentRuntime } from './agent-runtime.js';
import { InMemoryEventBus } from './event-bus.js';

interface FlowStep {
  order: number;
  kind: 'emit' | 'call' | 'expect';
  event?: string;
  agent?: string;
  action?: string;
}

function label(id: string): string {
  const separator = id.indexOf(':');
  return separator >= 0 ? id.slice(separator + 1) : id;
}

function order(edge: SemanticGraphEdge): number {
  return Number(edge.metadata?.order ?? 0);
}

function plan(graph: SemanticGraph, flowName: string): { intent: string; steps: FlowStep[] } {
  const flowId = `Flow:${flowName}`;
  const flow = graph.nodes.find(node => node.id === flowId);
  if (!flow) throw new Error(`Flow not found in Semantic Graph: ${flowName}`);

  const intentEdge = graph.edges.find(edge => edge.type === 'IMPLEMENTS_INTENT' && edge.from === flowId);
  if (!intentEdge) throw new Error(`Flow ${flowName} has no IMPLEMENTS_INTENT edge`);

  const edges = graph.edges.filter(edge => edge.from === flowId);
  const callsByOrder = new Map<number, { agent?: string; action?: string }>();
  const steps: FlowStep[] = [];

  for (const edge of edges) {
    if (edge.type === 'FLOW_CALLS_AGENT') {
      const item = callsByOrder.get(order(edge)) ?? {};
      item.agent = label(edge.to);
      callsByOrder.set(order(edge), item);
    } else if (edge.type === 'FLOW_CALLS_ACTION') {
      const item = callsByOrder.get(order(edge)) ?? {};
      item.action = label(edge.to);
      callsByOrder.set(order(edge), item);
    } else if (edge.type === 'FLOW_EMITS_EVENT') {
      steps.push({ order: order(edge), kind: 'emit', event: label(edge.to) });
    } else if (edge.type === 'FLOW_EXPECTS_EVENT') {
      steps.push({ order: order(edge), kind: 'expect', event: label(edge.to) });
    }
  }

  for (const [stepOrder, call] of callsByOrder) {
    if (!call.agent || !call.action) throw new Error(`Flow ${flowName} has incomplete call at order ${stepOrder}`);
    steps.push({ order: stepOrder, kind: 'call', agent: call.agent, action: call.action });
  }

  const priority: Record<FlowStep['kind'], number> = { emit: 0, call: 1, expect: 2 };
  steps.sort((a, b) => a.order - b.order || priority[a.kind] - priority[b.kind]);
  return { intent: label(intentEdge.to), steps };
}

export class FlowRuntime {
  constructor(
    private readonly state: CommerceState,
    private readonly agents: AgentRuntime,
    readonly events: InMemoryEventBus,
    private readonly graph: SemanticGraph,
  ) {}

  async execute(flowName: string, initialPayload: unknown): Promise<ExecutionReport> {
    const execution = plan(this.graph, flowName);
    let payload = initialPayload;
    let lastEvent: string | undefined;

    for (const step of execution.steps) {
      if (step.kind === 'emit') {
        this.events.emit(step.event!, payload);
        lastEvent = step.event;
        continue;
      }

      if (step.kind === 'call') {
        const result = await this.agents.execute(step.agent!, step.action!, { state: this.state, payload });
        this.events.emit(result.event, result.payload);
        lastEvent = result.event;
        payload = result.payload;
        if (result.status === 'Error') return { status: 'Error', intent: execution.intent, last_event: lastEvent, payload };
        continue;
      }

      if (lastEvent !== step.event) {
        return {
          status: 'Error',
          intent: execution.intent,
          last_event: lastEvent,
          payload: { message: `Flow expected ${step.event}, received ${lastEvent ?? 'nothing'}` },
        };
      }
    }

    return { status: 'Ok', intent: execution.intent, last_event: lastEvent, payload };
  }
}
