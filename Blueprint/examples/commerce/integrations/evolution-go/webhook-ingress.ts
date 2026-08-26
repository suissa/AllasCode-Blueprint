import type { ApplicationApi, ApiPrincipal } from '../../api/application-api.js';

export type NormalizedWhatsAppMessage={
  provider:'evolution-go';instance:string;message_id:string;from:string;
  timestamp?:string|undefined;push_name?:string|undefined;
  kind:'text'|'image'|'audio'|'document'|'unknown';
  text?:string|undefined;media?:Record<string,unknown>|undefined;raw:unknown;
};
export type DeliveryRecord={message_id:string;event:string;at:string;raw:unknown};
export interface MessageIdStore{has(id:string):boolean;add(id:string):void;}
export class InMemoryMessageIdStore implements MessageIdStore{private ids=new Set<string>();has(id:string){return this.ids.has(id);}add(id:string){this.ids.add(id);}}

function messageKind(message:any):NormalizedWhatsAppMessage['kind']{
  if(typeof message?.conversation==='string'||typeof message?.extendedTextMessage?.text==='string')return'text';
  if(message?.imageMessage)return'image'; if(message?.audioMessage)return'audio'; if(message?.documentMessage)return'document'; return'unknown';
}
function textOf(message:any):string|undefined{return message?.conversation??message?.extendedTextMessage?.text??message?.imageMessage?.caption??message?.documentMessage?.caption;}
function mediaOf(message:any,kind:NormalizedWhatsAppMessage['kind']):Record<string,unknown>|undefined{
  const source=kind==='image'?message?.imageMessage:kind==='audio'?message?.audioMessage:kind==='document'?message?.documentMessage:undefined;
  return source&&typeof source==='object'?source:undefined;
}

export class EvolutionGoWebhookIngress{
  readonly delivery:DeliveryRecord[]=[];
  constructor(
    private readonly api:ApplicationApi,
    private readonly ids:MessageIdStore,
    private readonly secret:string,
    private readonly principal:ApiPrincipal,
    private readonly inboundIntent='WhatsAppInboundMessageIntent',
  ){}

  async receive(headers:Record<string,string|undefined>,body:any):Promise<{status:number;body:unknown}>{
    if(!this.secret||headers['x-allascode-webhook-secret']!==this.secret)return{status:401,body:{received:false}};
    if(!body||typeof body.event!=='string'||typeof body.instance!=='string'||!body.data)return{status:400,body:{received:false,error:'invalid Evolution Go webhook'}};
    const event=body.event.toUpperCase();
    if(event!=='MESSAGE'){
      const id=String(body.data?.id??body.data?.key?.id??'');
      if(id)this.delivery.push({message_id:id,event,at:new Date().toISOString(),raw:body.data});
      return{status:200,body:{received:true,status_event:event}};
    }
    const key=body.data?.key??{};
    if(key.fromMe===true)return{status:200,body:{received:true,ignored:'fromMe'}};
    const id=String(key.id??'');
    const from=String(key.remoteJid??'');
    if(!id||!from)return{status:400,body:{received:false,error:'message id and sender are required'}};
    if(this.ids.has(id))return{status:200,body:{received:true,duplicate:true}};
    const message=body.data?.message??{}; const kind=messageKind(message);
    const normalized:NormalizedWhatsAppMessage={provider:'evolution-go',instance:body.instance,message_id:id,from,timestamp:body.data?.messageTimestamp,push_name:body.data?.pushName,kind,text:textOf(message),media:mediaOf(message,kind),raw:body.data};
    this.ids.add(id);
    const correlation=`whatsapp:${body.instance}:${id}`;
    const result=await this.api.command({intent:this.inboundIntent,payload:normalized,correlation_id:correlation,idempotency_key:id,principal:this.principal});
    return result.outcome==='Ok'?{status:200,body:{received:true,correlation_id:correlation}}:{status:422,body:{received:true,correlation_id:correlation,error:result.error}};
  }
}
