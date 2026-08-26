import type { CommerceState, ExecutionReport } from './types.js';
import type { SemanticGraph, SemanticGraphEdge } from './semantic-graph.js';
import { AgentRuntime } from './agent-runtime.js';
import { InMemoryEventBus } from './event-bus.js';
import { executeWithSemanticHealing } from './semantic-healing.js';
import { InMemoryHealingStore, type HealingCaseStore } from './healing-store.js';

function label(id: string): string { const separator = id.indexOf(':'); return separator >= 0 ? id.slice(separator + 1) : id; }
function order(edge: SemanticGraphEdge): number { return Number(edge.metadata?.order ?? 0); }
function flowContract(graph: SemanticGraph, flowName: string): { flow: string; intent: string; initialEvent: string; terminalEvent: string } {
  const flowId = `Flow:${flowName}`;
  if (!graph.nodes.some(node => node.id === flowId)) throw new Error(`Flow not found in Semantic Graph: ${flowName}`);
  const intentEdge = graph.edges.find(edge => edge.type === 'IMPLEMENTS_INTENT' && edge.from === flowId);
  if (!intentEdge) throw new Error(`Flow ${flowName} has no IMPLEMENTS_INTENT edge`);
  const initial = graph.edges.filter(edge => edge.type === 'FLOW_EMITS_EVENT' && edge.from === flowId).sort((a, b) => order(a) - order(b))[0];
  const terminal = graph.edges.filter(edge => edge.type === 'FLOW_EXPECTS_EVENT' && edge.from === flowId).sort((a, b) => order(a) - order(b)).at(-1);
  if (!initial) throw new Error(`Flow ${flowName} has no initial Event`);
  if (!terminal) throw new Error(`Flow ${flowName} has no terminal Event`);
  return { flow: flowName, intent: label(intentEdge.to), initialEvent: label(initial.to), terminalEvent: label(terminal.to) };
}
function contractForIntent(graph: SemanticGraph, intent: string) {
  const edge = graph.edges.find(candidate => candidate.type === 'IMPLEMENTS_INTENT' && candidate.to === `Intent:${intent}`);
  if (!edge) throw new Error(`No Flow implements Intent ${intent}`);
  return flowContract(graph, label(edge.from));
}
function correlationId(payload: unknown, intent: string, action: string): string {
  if (payload && typeof payload === 'object') {
    const value = payload as Record<string, unknown>;
    for (const key of ['correlation_id','idempotency_key','sale_id','purchase_id','invoice_id','accounting_entry_id','user_id']) {
      if (typeof value[key] === 'string' && value[key]) return `${intent}:${action}:${value[key]}`;
    }
  }
  return `${intent}:${action}`;
}
function mergeHumanPayload(original: unknown, human: unknown): unknown {
  if (original && human && typeof original === 'object' && typeof human === 'object' && !Array.isArray(original) && !Array.isArray(human)) return { ...(original as Record<string,unknown>), ...(human as Record<string,unknown>) };
  return human ?? original;
}

export class FlowRuntime {
  readonly healingStore: HealingCaseStore;

  constructor(
    private readonly state: CommerceState,
    private readonly agents: AgentRuntime,
    readonly events: InMemoryEventBus,
    private readonly graph: SemanticGraph,
    healingStore?: HealingCaseStore,
  ) { this.healingStore = healingStore ?? new InMemoryHealingStore(); }

  async execute(flowName: string, initialPayload: unknown): Promise<ExecutionReport> {
    const contract = flowContract(this.graph, flowName);
    return this.runQueue(contract, [{ event: contract.initialEvent, payload: initialPayload }], initialPayload);
  }

  async resume(caseId: string, resumeToken: string, humanPayload: unknown): Promise<ExecutionReport> {
    const healingCase = this.healingStore.consumeResume(caseId, resumeToken);
    const contract = contractForIntent(this.graph, healingCase.intent);
    const correctedPayload = mergeHumanPayload(healingCase.original_payload, humanPayload);
    const context = { state: this.state, payload: correctedPayload };
    const healing = await executeWithSemanticHealing(
      this.graph,
      healingCase.agent,
      healingCase.action,
      () => Promise.resolve(this.agents.execute(healingCase.agent, healingCase.action, context)),
      (alternativeAgent, alternativeAction) => Promise.resolve(this.agents.execute(alternativeAgent, alternativeAction, context)),
      { intent:healingCase.intent, original_event:healingCase.original_event, original_payload:correctedPayload, correlation_id:healingCase.correlation_id, store:this.healingStore },
    );
    if (healing.result.status === 'Error') {
      this.events.emit(healing.result.event, healing.result.payload);
      this.healingStore.audit({kind:'resolution',case_id:healingCase.id,agent:healingCase.agent,action:healingCase.action,detail:`Human resume ended with Error:${healing.result.event}`});
      return { status:'Error', intent:healingCase.intent, last_event:healing.result.event, payload:{ ...healing.result.payload, healing:healing.decision } };
    }
    const report=await this.runQueue(contract,[{event:healing.result.event,payload:healing.result.payload}],correctedPayload);
    this.healingStore.audit({kind:'resolution',case_id:healingCase.id,agent:healingCase.agent,action:healingCase.action,detail:`Human resume completed with ${report.status}:${report.last_event??'unknown'}`});
    return report;
  }

  private async runQueue(contract:{flow:string;intent:string;initialEvent:string;terminalEvent:string},initialQueue:Array<{event:string;payload:unknown}>,initialPayload:unknown):Promise<ExecutionReport>{
    const queue=[...initialQueue];let terminalPayload:unknown=initialPayload;let terminalSeen=false;let lastEvent:string|undefined;let transitions=0;
    while(queue.length){
      if(++transitions>64) return {status:'Error',intent:contract.intent,last_event:lastEvent,payload:{message:'Event choreography exceeded 64 transitions; possible cycle'}};
      const message=queue.shift()!;this.events.emit(message.event,message.payload);lastEvent=message.event;
      if(message.event===contract.terminalEvent){terminalSeen=true;terminalPayload=message.payload;continue;}
      const eventId=`Event:${message.event}`;
      const dispatches=this.graph.edges.filter(edge=>edge.type==='DISPATCHES'&&edge.from===eventId);
      if(dispatches.length===0) return {status:'Error',intent:contract.intent,last_event:lastEvent,payload:{message:`No Agent listens to ${message.event}`}};
      for(const dispatch of dispatches){
        const action=label(dispatch.to);const owner=this.graph.edges.find(edge=>edge.type==='ACTION_OWNER'&&edge.from===dispatch.to);
        if(!owner) return {status:'Error',intent:contract.intent,last_event:lastEvent,payload:{message:`Action ${action} has no owner`}};
        const agent=label(owner.to);if(!this.graph.edges.some(edge=>edge.type==='LISTENS'&&edge.from===owner.to&&edge.to===eventId)) continue;
        const context={state:this.state,payload:message.payload};
        const healing=await executeWithSemanticHealing(this.graph,agent,action,()=>Promise.resolve(this.agents.execute(agent,action,context)),(alternativeAgent,alternativeAction)=>Promise.resolve(this.agents.execute(alternativeAgent,alternativeAction,context)),{intent:contract.intent,original_event:message.event,original_payload:message.payload,correlation_id:correlationId(message.payload,contract.intent,action),store:this.healingStore});
        const result=healing.result;
        if(result.status==='Error'){this.events.emit(result.event,result.payload);return {status:'Error',intent:contract.intent,last_event:result.event,payload:{...result.payload,healing:healing.decision}};}
        queue.push({event:result.event,payload:result.payload});
      }
    }
    if(!terminalSeen) return {status:'Error',intent:contract.intent,last_event:lastEvent,payload:{message:`Flow ended without terminal Event ${contract.terminalEvent}`}};
    return {status:'Ok',intent:contract.intent,last_event:contract.terminalEvent,payload:terminalPayload};
  }
}
