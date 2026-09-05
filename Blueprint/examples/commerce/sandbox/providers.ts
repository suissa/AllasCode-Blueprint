export type SandboxWhatsAppMessage={id:string;from:string;kind:'text'|'audio'|'image'|'document';text?:string;media_ref?:string};
export class SandboxWhatsAppProvider{
 readonly outbound:Array<{to:string;text:string}>=[];
 inbound(message:SandboxWhatsAppMessage){return {event:'messages.upsert',instance:'sandbox',data:{key:{id:message.id,remoteJid:message.from},message:{conversation:message.text},kind:message.kind,media_ref:message.media_ref}};}
 async sendText(to:string,text:string){this.outbound.push({to,text});return {provider_message_id:`sandbox-wa-${this.outbound.length}`};}
}

export class SandboxPaymentProvider{
 detect(input:{sale_id:string;amount:number;currency:'BRL'}){return {provider:'sandbox-payment',event_id:`sandbox-payment-${input.sale_id}`,status:'confirmed',...input};}
}

export class SandboxFiscalProvider{
 issue(input:{invoice_id:string;sale_id:string;amount:number;currency:'BRL'}){return {provider:'sandbox-fiscal',external_id:`SANDBOX-NF-${input.invoice_id}`,status:'authorized',...input};}
}
