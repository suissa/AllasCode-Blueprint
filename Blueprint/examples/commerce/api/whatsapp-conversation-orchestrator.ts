import type { ApiPrincipal, IntentRuntime } from './application-api.js';

export type WhatsAppMessageKind='text'|'image'|'audio'|'document'|'unknown';
export type WhatsAppInboundMessage={
  provider:string;
  instance:string;
  message_id:string;
  from:string;
  timestamp?:string|undefined;
  push_name?:string|undefined;
  kind:WhatsAppMessageKind;
  text?:string|undefined;
  media?:Record<string,unknown>|undefined;
  raw?:unknown;
};

export type ConversationMode='idle'|'purchase'|'sale';
export type ConversationStatus='active'|'waiting-human'|'completed';
export type ConversationTurn={direction:'inbound'|'outbound';message_id?:string|undefined;text?:string|undefined;kind:WhatsAppMessageKind|'semantic';at:string};
export type ConversationSession={
  id:string;
  participant:string;
  instance:string;
  mode:ConversationMode;
  status:ConversationStatus;
  context:Record<string,unknown>;
  turns:ConversationTurn[];
  updated_at:string;
  expires_at:string;
};

export interface ConversationStore{
  load(id:string):Promise<ConversationSession|undefined>;
  save(session:ConversationSession):Promise<void>;
  delete(id:string):Promise<void>;
}
export interface ConversationReplyPort{sendText(input:{instance:string;to:string;text:string;correlation_id:string}):Promise<{provider_message_id?:string|undefined}>;}
export interface Clock{now():Date;}

export class InMemoryConversationStore implements ConversationStore{
  private readonly sessions=new Map<string,ConversationSession>();
  async load(id:string){const value=this.sessions.get(id);return value?structuredClone(value):undefined;}
  async save(session:ConversationSession){this.sessions.set(session.id,structuredClone(session));}
  async delete(id:string){this.sessions.delete(id);}
}

function canonicalParticipant(value:string):string{return value.replace(/@.*$/,'');}
function conversationId(message:WhatsAppInboundMessage):string{return `whatsapp:${message.instance}:${canonicalParticipant(message.from)}`;}
function compact(text:string):string{return text.trim().replace(/\s+/g,' ');}
function lower(text:string):string{return compact(text).toLocaleLowerCase('pt-BR');}
function initialMode(text:string):ConversationMode{
  const value=lower(text);
  if(/\b(compra|comprei|fornecedor|mercado|estoque|nota|pix|comprovante)\b/.test(value))return'purchase';
  if(/\b(venda|vendi|maquininha|cart[aã]o|cliente)\b/.test(value))return'sale';
  return'idle';
}
function parseJson(text:string):Record<string,unknown>|undefined{
  try{const value=JSON.parse(text);return value&&typeof value==='object'&&!Array.isArray(value)?value:undefined;}catch{return undefined;}
}
function hasArray(value:Record<string,unknown>,key:string){return Array.isArray(value[key])&&(value[key] as unknown[]).length>0;}
function missingPurchase(context:Record<string,unknown>):string[]{const missing:string[]=[];if(!context.supplier_id&&!context.supplier_name)missing.push('fornecedor');if(!hasArray(context,'items'))missing.push('produtos, quantidades e preços');if(!context.purchase_id)missing.push('identificador da compra');return missing;}
function missingSale(context:Record<string,unknown>):string[]{const missing:string[]=[];if(!context.sale_id)missing.push('identificador da venda');if(!hasArray(context,'items'))missing.push('produtos vendidos');return missing;}
function intentFor(mode:ConversationMode):string|undefined{return mode==='purchase'?'PurchaseProductsIntent':mode==='sale'?'ProcessSaleIntent':undefined;}
function mergeContext(context:Record<string,unknown>,message:WhatsAppInboundMessage):Record<string,unknown>{
  const parsed=message.text?parseJson(message.text):undefined;
  const evidence=message.kind!=='text'&&message.kind!=='unknown'?{kind:message.kind,media:message.media,provider_message_id:message.message_id}:undefined;
  return {...context,...(parsed??{}),...(evidence?{purchase_evidence:evidence}:{})};
}
function semanticReply(result:{outcome:'Ok'|'Error';data?:unknown;error?:{code:string;message:string}}):string{
  if(result.outcome==='Error')return `Não consegui concluir: ${result.error?.message??'resultado semântico inválido'}. Vou manter o contexto para correção.`;
  const data=result.data as any;
  if(typeof data?.reply==='string')return data.reply;
  if(typeof data?.message==='string')return data.message;
  return 'Operação concluída.';
}

export class WhatsAppConversationOrchestrator implements IntentRuntime{
  constructor(
    private readonly domain:IntentRuntime,
    private readonly store:ConversationStore,
    private readonly replies:ConversationReplyPort,
    private readonly principal:ApiPrincipal,
    private readonly timeoutMs=30*60*1000,
    private readonly clock:Clock={now:()=>new Date()},
  ){}

  async execute(input:{intent:string;payload:unknown;correlation_id:string;idempotency_key:string;principal_id:string}):Promise<{outcome:'Ok'|'Error';data?:unknown;error?:{code:string;message:string}}>{
    if(input.intent!=='WhatsAppInboundMessageIntent')return this.domain.execute(input);
    if(!input.payload||typeof input.payload!=='object')return{outcome:'Error',error:{code:'INVALID_WHATSAPP_MESSAGE',message:'WhatsApp payload must be an object'}};
    const message=input.payload as WhatsAppInboundMessage;
    if(!message.instance||!message.from||!message.message_id)return{outcome:'Error',error:{code:'INVALID_WHATSAPP_MESSAGE',message:'instance, from and message_id are required'}};

    const id=conversationId(message),now=this.clock.now();
    let session=await this.store.load(id);
    if(session&&Date.parse(session.expires_at)<=now.getTime())session=undefined;
    if(!session)session={id,participant:canonicalParticipant(message.from),instance:message.instance,mode:'idle',status:'active',context:{},turns:[],updated_at:now.toISOString(),expires_at:new Date(now.getTime()+this.timeoutMs).toISOString()};
    session.turns.push({direction:'inbound',message_id:message.message_id,text:message.text,kind:message.kind,at:now.toISOString()});
    session.context=mergeContext(session.context,message);
    if(session.mode==='idle'&&message.text)session.mode=initialMode(message.text);

    if(session.mode==='idle')return this.clarify(session,input.correlation_id,'Preciso saber a intenção: esta conversa é sobre uma compra de fornecedor ou sobre uma venda?');
    const missing=session.mode==='purchase'?missingPurchase(session.context):missingSale(session.context);
    if(missing.length)return this.clarify(session,input.correlation_id,`Falta contexto para continuar: ${missing.join('; ')}. Envie esses dados; não vou inventá-los.`);

    const intent=intentFor(session.mode)!;
    const result=await this.domain.execute({intent,payload:session.context,correlation_id:input.correlation_id,idempotency_key:input.idempotency_key,principal_id:this.principal.id});
    const reply=semanticReply(result);
    await this.replies.sendText({instance:session.instance,to:session.participant,text:reply,correlation_id:input.correlation_id});
    session.turns.push({direction:'outbound',text:reply,kind:'semantic',at:now.toISOString()});
    session.status=result.outcome==='Ok'?'completed':'waiting-human';
    session.updated_at=now.toISOString();session.expires_at=new Date(now.getTime()+this.timeoutMs).toISOString();
    await this.store.save(session);
    return result.outcome==='Ok'?{outcome:'Ok',data:{conversation_id:id,dispatched_intent:intent,semantic_outcome:result.data}}:{outcome:'Error',error:result.error??{code:'SEMANTIC_ERROR',message:'Intent ended with Error'}};
  }

  private async clarify(session:ConversationSession,correlation_id:string,text:string){
    const now=this.clock.now();session.status='waiting-human';session.updated_at=now.toISOString();session.expires_at=new Date(now.getTime()+this.timeoutMs).toISOString();
    session.turns.push({direction:'outbound',text,kind:'semantic',at:now.toISOString()});await this.store.save(session);
    await this.replies.sendText({instance:session.instance,to:session.participant,text,correlation_id});
    return{outcome:'Ok' as const,data:{conversation_id:session.id,state:'waiting-human',reply:text}};
  }
}
