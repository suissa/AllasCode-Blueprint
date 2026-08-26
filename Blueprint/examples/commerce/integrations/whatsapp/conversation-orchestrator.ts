import type { ApplicationApi,ApiPrincipal,ApiEnvelope } from '../../api/application-api.js';

export type ConversationMode='purchase-intake'|'sale-resolution';
export type ConversationState={conversation_id:string;peer:string;mode?:ConversationMode;pending_intent?:string;context:Record<string,unknown>;updated_at:string;expires_at:string};
export interface ConversationStore{get(peer:string):Promise<ConversationState|undefined>;put(state:ConversationState):Promise<void>;delete(peer:string):Promise<void>}
export class InMemoryConversationStore implements ConversationStore{private data=new Map<string,ConversationState>();async get(peer:string){return this.data.get(peer)}async put(s:ConversationState){this.data.set(s.peer,s)}async delete(peer:string){this.data.delete(peer)}}
export type ConversationReply={kind:'reply'|'clarification'|'completed';text:string;correlation_id:string;outcome?:ApiEnvelope};
export type InboundConversationMessage={message_id:string;from:string;kind:'text'|'image'|'audio'|'document'|'unknown';text?:string;media?:Record<string,unknown>;raw?:unknown};

export class WhatsAppConversationOrchestrator{
 constructor(private api:ApplicationApi,private store:ConversationStore,private principal:ApiPrincipal,private timeoutMs=30*60_000){}
 async handle(message:InboundConversationMessage):Promise<ConversationReply>{
  const now=Date.now(); let state=await this.store.get(message.from);
  if(state&&Date.parse(state.expires_at)<=now){await this.store.delete(message.from);state=undefined}
  const correlation_id=state?.conversation_id??`wa-conversation:${message.from}:${message.message_id}`;
  if(!state){
   const mode=this.resolveMode(message);
   if(!mode)return{kind:'clarification',text:'Não consegui determinar se esta mensagem inicia uma compra de fornecedor ou a identificação dos produtos de uma venda. Qual dessas duas operações você quer realizar?',correlation_id};
   state={conversation_id:correlation_id,peer:message.from,mode,context:{},updated_at:new Date(now).toISOString(),expires_at:new Date(now+this.timeoutMs).toISOString()};
  }
  state.context={...state.context,last_message:message};state.updated_at=new Date(now).toISOString();state.expires_at=new Date(now+this.timeoutMs).toISOString();
  const intent=state.mode==='purchase-intake'?'PurchaseProductsIntent':'SellProductsIntent';
  state.pending_intent=intent;await this.store.put(state);
  const missing=this.missingContext(state,message);
  if(missing){return{kind:'clarification',text:missing,correlation_id}}
  const result=await this.api.command({intent,payload:{conversation:state.context,channel:'whatsapp'},correlation_id,idempotency_key:message.message_id,principal:this.principal});
  if(result.outcome==='Error'){
   if(result.error?.code==='MISSING_CONTEXT'||result.error?.code==='HEALING_REQUIRED')return{kind:'clarification',text:result.error.message,correlation_id,outcome:result};
   return{kind:'reply',text:result.error?.message??'A operação não pôde ser concluída.',correlation_id,outcome:result};
  }
  await this.store.delete(message.from);
  return{kind:'completed',text:state.mode==='purchase-intake'?'Compra recebida e processada.':'Produtos da venda recebidos e processados.',correlation_id,outcome:result};
 }
 private resolveMode(m:InboundConversationMessage):ConversationMode|undefined{
  const text=(m.text??'').toLowerCase();
  if(m.kind==='image'||m.kind==='document'||/compra|fornecedor|pix|comprovante/.test(text))return'purchase-intake';
  if(/venda|maquininha|produto[s]? da venda/.test(text))return'sale-resolution';
 }
 private missingContext(state:ConversationState,m:InboundConversationMessage):string|undefined{
  if(state.mode==='purchase-intake'&&m.kind==='unknown')return'Envie o comprovante da compra e informe os produtos, quantidades e preços; pode ser por texto ou áudio.';
  if(state.mode==='sale-resolution'&&!m.text&&m.kind!=='audio')return'Informe quais produtos pertencem a esta venda, por texto ou áudio.';
 }
}
