export type CommunicationProvider='whatsapp'|'telegram'|'instagram'|'facebook'|'tiktok';
export type MessageKind='text'|'image'|'audio'|'document'|'video';
export type DeliveryStatus='accepted'|'sent'|'delivered'|'read'|'failed';
export type ProviderCapability='inbound'|'send-text'|'send-media'|'message-status'|'webhook';

export type ProviderCapabilities={provider:CommunicationProvider;capabilities:ReadonlySet<ProviderCapability>};
export type InboundProviderMessage={provider:CommunicationProvider;account_id:string;conversation_id:string;message_id:string;sender_id:string;kind:MessageKind;text?:string;media_url?:string;mime_type?:string;occurred_at:string;raw:unknown};
export type NormalizedInboundMessage={provider:CommunicationProvider;account_id:string;conversation_id:string;sender_id:string;kind:MessageKind;text?:string;media_url?:string;mime_type?:string;occurred_at:string;idempotency_key:string;correlation_id:string;raw:unknown};
export type OutboundMessage={provider:CommunicationProvider;account_id:string;conversation_id:string;kind:MessageKind;text?:string;media_url?:string;idempotency_key:string};
export type ProviderSendResult={provider_message_id:string;status:DeliveryStatus};
export type TransportStatusEvent={provider:CommunicationProvider;provider_message_id:string;status:DeliveryStatus;occurred_at:string;correlation_id:string};

export interface CommunicationProviderAdapter{
 readonly capabilities:ProviderCapabilities;
 verifyWebhook(input:{headers:Record<string,string|undefined>;rawBody:string}):boolean;
 normalizeInbound(raw:unknown):InboundProviderMessage;
 send(message:OutboundMessage):Promise<{outcome:'Ok';result:ProviderSendResult}|{outcome:'Error';code:'UnsupportedCapability'|'ProviderError';detail?:string}>;
 messageStatus?(provider_message_id:string):Promise<{outcome:'Ok';status:DeliveryStatus}|{outcome:'Error';code:'UnsupportedCapability'|'ProviderError'}>;
}

const has=(caps:ProviderCapabilities,cap:ProviderCapability)=>caps.capabilities.has(cap);

export function normalizeProviderMessage(input:InboundProviderMessage):NormalizedInboundMessage{
 return{provider:input.provider,account_id:input.account_id,conversation_id:input.conversation_id,sender_id:input.sender_id,kind:input.kind,occurred_at:input.occurred_at,idempotency_key:input.message_id,correlation_id:`${input.provider}:${input.account_id}:${input.message_id}`,raw:input.raw,...(input.text?{text:input.text}:{}),...(input.media_url?{media_url:input.media_url}:{}),...(input.mime_type?{mime_type:input.mime_type}:{})};
}

export class OmnichannelCommunication{
 private adapters=new Map<CommunicationProvider,CommunicationProviderAdapter>();
 private inboundKeys=new Set<string>();
 private outboundKeys=new Map<string,ProviderSendResult>();
 register(adapter:CommunicationProviderAdapter){this.adapters.set(adapter.capabilities.provider,adapter);}
 ingest(provider:CommunicationProvider,raw:unknown,verification:{headers:Record<string,string|undefined>;rawBody:string}){
  const adapter=this.adapters.get(provider);if(!adapter)return{outcome:'Error' as const,code:'ProviderNotConfigured' as const};if(!has(adapter.capabilities,'inbound'))return{outcome:'Error' as const,code:'UnsupportedCapability' as const};if(has(adapter.capabilities,'webhook')&&!adapter.verifyWebhook(verification))return{outcome:'Error' as const,code:'WebhookVerificationFailed' as const};const normalized=normalizeProviderMessage(adapter.normalizeInbound(raw));const key=`${provider}:${normalized.idempotency_key}`;if(this.inboundKeys.has(key))return{outcome:'Ok' as const,message:normalized,duplicate:true as const};this.inboundKeys.add(key);return{outcome:'Ok' as const,message:normalized};
 }
 async send(message:OutboundMessage){const adapter=this.adapters.get(message.provider);if(!adapter)return{outcome:'Error' as const,code:'ProviderNotConfigured' as const};const capability:ProviderCapability=message.kind==='text'?'send-text':'send-media';if(!has(adapter.capabilities,capability))return{outcome:'Error' as const,code:'UnsupportedCapability' as const};const key=`${message.provider}:${message.idempotency_key}`;const previous=this.outboundKeys.get(key);if(previous)return{outcome:'Ok' as const,result:{...previous},duplicate:true as const};const result=await adapter.send(message);if(result.outcome==='Ok')this.outboundKeys.set(key,result.result);return result;}
 async status(provider:CommunicationProvider,providerMessageId:string){const adapter=this.adapters.get(provider);if(!adapter)return{outcome:'Error' as const,code:'ProviderNotConfigured' as const};if(!has(adapter.capabilities,'message-status')||!adapter.messageStatus)return{outcome:'Error' as const,code:'UnsupportedCapability' as const};return adapter.messageStatus(providerMessageId);}
}

abstract class BasicAdapter implements CommunicationProviderAdapter{
 abstract readonly capabilities:ProviderCapabilities;
 constructor(protected readonly webhookSecret?:string){}
 verifyWebhook(input:{headers:Record<string,string|undefined>;rawBody:string}){if(!this.webhookSecret)return true;return input.headers['x-allascode-webhook-secret']===this.webhookSecret;}
 abstract normalizeInbound(raw:unknown):InboundProviderMessage;
 abstract send(message:OutboundMessage):Promise<{outcome:'Ok';result:ProviderSendResult}|{outcome:'Error';code:'UnsupportedCapability'|'ProviderError';detail?:string}>;
}

export class TelegramAdapter extends BasicAdapter{
 readonly capabilities={provider:'telegram' as const,capabilities:new Set<ProviderCapability>(['inbound','send-text','send-media','webhook'])};
 normalizeInbound(raw:any):InboundProviderMessage{const m=raw?.message??raw?.edited_message;return{provider:'telegram',account_id:String(raw?.bot_id??'default'),conversation_id:String(m?.chat?.id),message_id:String(m?.message_id),sender_id:String(m?.from?.id),kind:m?.photo?'image':m?.voice?'audio':m?.document?'document':m?.video?'video':'text',occurred_at:new Date(Number(m?.date??0)*1000).toISOString(),raw,...(m?.text?{text:m.text}:{}),...(m?.file_url?{media_url:m.file_url}:{})};}
 async send(message:OutboundMessage){return{outcome:'Ok' as const,result:{provider_message_id:`telegram:${message.idempotency_key}`,status:'accepted' as const}};}
}

export class InstagramAdapter extends BasicAdapter{
 readonly capabilities={provider:'instagram' as const,capabilities:new Set<ProviderCapability>(['inbound','send-text','send-media','webhook'])};
 normalizeInbound(raw:any):InboundProviderMessage{const e=raw?.entry?.[0]?.messaging?.[0]??raw;return{provider:'instagram',account_id:String(raw?.entry?.[0]?.id??e?.recipient?.id??'default'),conversation_id:String(e?.sender?.id),message_id:String(e?.message?.mid),sender_id:String(e?.sender?.id),kind:e?.message?.attachments?.[0]?.type==='image'?'image':e?.message?.attachments?.[0]?.type==='video'?'video':'text',text:e?.message?.text,media_url:e?.message?.attachments?.[0]?.payload?.url,occurred_at:new Date(Number(e?.timestamp??Date.now())).toISOString(),raw};}
 async send(message:OutboundMessage){return{outcome:'Ok' as const,result:{provider_message_id:`instagram:${message.idempotency_key}`,status:'accepted' as const}};}
}

export class FacebookMessengerAdapter extends BasicAdapter{
 readonly capabilities={provider:'facebook' as const,capabilities:new Set<ProviderCapability>(['inbound','send-text','send-media','message-status','webhook'])};
 normalizeInbound(raw:any):InboundProviderMessage{const e=raw?.entry?.[0]?.messaging?.[0]??raw;return{provider:'facebook',account_id:String(raw?.entry?.[0]?.id??e?.recipient?.id??'default'),conversation_id:String(e?.sender?.id),message_id:String(e?.message?.mid),sender_id:String(e?.sender?.id),kind:e?.message?.attachments?.[0]?.type==='image'?'image':e?.message?.attachments?.[0]?.type==='audio'?'audio':e?.message?.attachments?.[0]?.type==='file'?'document':e?.message?.attachments?.[0]?.type==='video'?'video':'text',text:e?.message?.text,media_url:e?.message?.attachments?.[0]?.payload?.url,occurred_at:new Date(Number(e?.timestamp??Date.now())).toISOString(),raw};}
 async send(message:OutboundMessage){return{outcome:'Ok' as const,result:{provider_message_id:`facebook:${message.idempotency_key}`,status:'accepted' as const}};}
 async messageStatus(){return{outcome:'Ok' as const,status:'delivered' as const};}
}

export class TikTokAdapter extends BasicAdapter{
 readonly capabilities={provider:'tiktok' as const,capabilities:new Set<ProviderCapability>(['inbound','webhook'])};
 normalizeInbound(raw:any):InboundProviderMessage{return{provider:'tiktok',account_id:String(raw?.account_id??'default'),conversation_id:String(raw?.conversation_id??raw?.sender_id??'unknown'),message_id:String(raw?.message_id??raw?.id),sender_id:String(raw?.sender_id??raw?.user_id??'unknown'),kind:raw?.kind??'text',text:raw?.text,media_url:raw?.media_url,occurred_at:String(raw?.occurred_at??new Date().toISOString()),raw};}
 async send(){return{outcome:'Error' as const,code:'UnsupportedCapability' as const,detail:'TikTok adapter does not expose a general-purpose outbound DM capability.'};}
}
