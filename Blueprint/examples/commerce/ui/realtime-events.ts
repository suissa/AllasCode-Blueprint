import {Notification} from './design-system.js';

export type UiSemanticEvent={event_id:string;cursor:string;name:string;occurred_at:string;correlation_id:string;severity:'info'|'warning'|'error';affected_projections:string[];human_required?:boolean;message?:string};
export type RealtimeSubscription={close():void};
export interface RealtimeEventTransport{connect(input:{after?:string;onEvent:(event:UiSemanticEvent)=>void;onDisconnect:(error?:unknown)=>void}):RealtimeSubscription;}
export interface CursorStore{load():string|undefined;save(cursor:string):void;}
export type UiNotification={id:string;tone:'neutral'|'warning'|'danger';message:string;correlation_id:string};

export class RealtimeUiCoordinator{
 private readonly seen=new Set<string>();
 private subscription?:RealtimeSubscription;
 private stopped=false;
 constructor(private readonly transport:RealtimeEventTransport,private readonly cursors:CursorStore,private readonly invalidate:(projections:string[],event:UiSemanticEvent)=>void,private readonly notify:(notification:UiNotification)=>void){}
 start(){this.stopped=false;this.open();}
 stop(){this.stopped=true;this.subscription?.close();this.subscription=undefined;}
 reconnect(){if(this.stopped)return;this.subscription?.close();this.open();}
 private open(){this.subscription=this.transport.connect({after:this.cursors.load(),onEvent:event=>this.accept(event),onDisconnect:()=>{if(!this.stopped)this.open();}});}
 private accept(event:UiSemanticEvent){if(this.seen.has(event.event_id))return;this.seen.add(event.event_id);this.cursors.save(event.cursor);if(event.affected_projections.length)this.invalidate([...new Set(event.affected_projections)],event);if(event.severity==='error'||event.human_required){this.notify({id:event.event_id,tone:event.severity==='error'?'danger':'warning',message:event.message??(event.human_required?'Intervenção humana necessária.':'Ocorreu um erro.'),correlation_id:event.correlation_id});}}
}

export function renderRealtimeNotifications(items:UiNotification[]){return `<aside class="realtime-notifications" aria-label="Notificações" aria-live="polite">${items.map(item=>Notification({message:item.message,tone:item.tone})).join('')}</aside>`;}

// Realtime events are observation-only. This module can invalidate projections and surface
// notifications, but it intentionally has no SemanticUiClient.command dependency and cannot mutate domain state.
