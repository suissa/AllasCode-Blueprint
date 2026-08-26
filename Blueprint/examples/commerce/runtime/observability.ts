import { randomUUID } from 'node:crypto';

export interface TraceContext { trace_id:string; correlation_id:string; causation_id?:string; operator_id?:string; }
export interface TraceRecord extends TraceContext { id:string; at:string; kind:'intent'|'event'|'action'|'agent'|'provider'|'healing'|'human'; name:string; status:'started'|'Ok'|'Error'; attributes:Record<string,unknown>; }
export interface AuditRecord extends TraceContext { id:string; at:string; operation:string; resource:string; operator_id:string; outcome:'Ok'|'Error'; attributes:Record<string,unknown>; }

const SENSITIVE=/(password|secret|token|authorization|cookie|api[_-]?key|card|cvv|document|cpf)/i;
export function redact(value:unknown):unknown {
  if(Array.isArray(value)) return value.map(redact);
  if(value&&typeof value==='object') return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([k,v])=>[k,SENSITIVE.test(k)?'[REDACTED]':redact(v)]));
  return value;
}

export class ObservabilityRuntime {
  readonly traces:TraceRecord[]=[];
  readonly audits:AuditRecord[]=[];
  private readonly counters=new Map<string,number>();
  context(input:Partial<TraceContext>={}):TraceContext { return {trace_id:input.trace_id??randomUUID(),correlation_id:input.correlation_id??randomUUID(),causation_id:input.causation_id,operator_id:input.operator_id}; }
  trace(ctx:TraceContext,kind:TraceRecord['kind'],name:string,status:TraceRecord['status'],attributes:Record<string,unknown>={}):TraceRecord { const r={id:randomUUID(),at:new Date().toISOString(),...ctx,kind,name,status,attributes:redact(attributes) as Record<string,unknown>}; this.traces.push(r); this.increment(`trace.${kind}.${status}`); return r; }
  audit(ctx:TraceContext,input:{operation:string;resource:string;operator_id?:string;outcome:'Ok'|'Error';attributes?:Record<string,unknown>}):AuditRecord { const operator_id=input.operator_id??ctx.operator_id; if(!operator_id) throw new Error('AuditOperatorRequired'); const r={id:randomUUID(),at:new Date().toISOString(),...ctx,operator_id,operation:input.operation,resource:input.resource,outcome:input.outcome,attributes:redact(input.attributes??{}) as Record<string,unknown>}; this.audits.push(r); this.increment(`audit.${input.outcome}`); return r; }
  healing(ctx:TraceContext,name:string,status:'Ok'|'Error',attributes:Record<string,unknown>={}):TraceRecord { return this.trace(ctx,'healing',name,status,attributes); }
  human(ctx:TraceContext,name:string,operator_id:string,status:'Ok'|'Error',attributes:Record<string,unknown>={}):TraceRecord { return this.trace({...ctx,operator_id},'human',name,status,attributes); }
  increment(metric:string,by=1):void { this.counters.set(metric,(this.counters.get(metric)??0)+by); }
  metrics():Record<string,number> { return Object.fromEntries(this.counters); }
  health(){ const errors=[...this.counters].filter(([k])=>k.endsWith('.Error')).reduce((n,[,v])=>n+v,0); return {status:errors?'degraded':'healthy',errors,traces:this.traces.length,audits:this.audits.length}; }
  continuity(trace_id:string):TraceRecord[]{ return this.traces.filter(r=>r.trace_id===trace_id); }
}
