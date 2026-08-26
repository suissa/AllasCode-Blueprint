export type EventEnvelope={event_id:string;name:string;payload:unknown;occurred_at:string;correlation_id:string;causation_id?:string;idempotency_key:string;ordering_key?:string;attempt?:number};
export type DeliveryResult={outcome:'Ok'}|{outcome:'Error';code:string;retryable:boolean};
export interface EventTransportPort{publish(event:EventEnvelope):Promise<void>;subscribe(handler:(event:EventEnvelope)=>Promise<void>):()=>void;}
export class InMemoryEventTransport implements EventTransportPort{private handlers=new Set<(event:EventEnvelope)=>Promise<void>>();async publish(event:EventEnvelope){for(const h of this.handlers)await h(event);}subscribe(handler:(event:EventEnvelope)=>Promise<void>){this.handlers.add(handler);return()=>this.handlers.delete(handler);}}
export interface EventFailureSink{record(event:{name:'EventDelivery.Error';source_event:EventEnvelope;code:string;attempts:number}):Promise<void>;}
export class ReliableEventBus{
 private seen=new Set<string>();private locks=new Map<string,Promise<void>>();
 constructor(private readonly transport:EventTransportPort,private readonly failureSink:EventFailureSink,private readonly maxAttempts=3){}
 async publish(event:EventEnvelope){if(!event.event_id||!event.correlation_id||!event.idempotency_key)throw new Error('EventEnvelopeIdentifiersRequired');await this.transport.publish({...event,attempt:0});}
 subscribe(handler:(event:EventEnvelope)=>Promise<DeliveryResult>){return this.transport.subscribe(async event=>{if(this.seen.has(event.idempotency_key))return;const key=event.ordering_key??event.correlation_id;const previous=this.locks.get(key)??Promise.resolve();const current=previous.then(async()=>{let attempt=0;while(attempt<this.maxAttempts){attempt++;const result=await handler({...event,attempt});if(result.outcome==='Ok'){this.seen.add(event.idempotency_key);return;}if(!result.retryable||attempt>=this.maxAttempts){await this.failureSink.record({name:'EventDelivery.Error',source_event:{...event,attempt},code:result.code,attempts:attempt});return;}}});this.locks.set(key,current.finally(()=>{if(this.locks.get(key)===current)this.locks.delete(key);}));await current;});}
 async replay(events:EventEnvelope[]){for(const e of [...events].sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at)||a.event_id.localeCompare(b.event_id)))await this.transport.publish(e);}
}
export type EventBusConfig={transport:'memory'|'production'};
export function createEventBus(config:EventBusConfig,ports:{memory:EventTransportPort;production?:EventTransportPort;failureSink:EventFailureSink}){const transport=config.transport==='memory'?ports.memory:ports.production;if(!transport)throw new Error('ProductionEventTransportRequired');return new ReliableEventBus(transport,ports.failureSink);}
