import test from 'node:test';
import assert from 'node:assert/strict';
import { ApplicationApi } from '../api/application-api.js';
import { EvolutionGoProvider } from '../integrations/evolution-go/provider.js';
import { EvolutionGoWebhookIngress, InMemoryMessageIdStore } from '../integrations/evolution-go/webhook-ingress.js';

function api(executions:any[]){return new ApplicationApi({async execute(input){executions.push(input);return{outcome:'Ok',data:{accepted:true}};}},{async read(){return[];}},{allows(){return true;}});}
const principal={id:'whatsapp:evolution-go',permissions:['execute:WhatsAppInboundMessageIntent']};
const secret='test-secret';

function webhook(message:any,id='MSG-1'){return{event:'MESSAGE',instance:'sales',data:{key:{remoteJid:'5511999999999@s.whatsapp.net',fromMe:false,id},message,messageTimestamp:'1700000000',pushName:'Customer'}};}

test('Evolution Go webhook authenticates, maps text to Intent and propagates provider idempotency',async()=>{
  const executions:any[]=[]; const ingress=new EvolutionGoWebhookIngress(api(executions),new InMemoryMessageIdStore(),secret,principal);
  assert.equal((await ingress.receive({},webhook({conversation:'beer'}))).status,401);
  const first=await ingress.receive({'x-allascode-webhook-secret':secret},webhook({conversation:'beer'}));
  const second=await ingress.receive({'x-allascode-webhook-secret':secret},webhook({conversation:'beer'}));
  assert.equal(first.status,200); assert.deepEqual(second.body,{received:true,duplicate:true}); assert.equal(executions.length,1);
  assert.equal(executions[0].intent,'WhatsAppInboundMessageIntent'); assert.equal(executions[0].idempotency_key,'MSG-1'); assert.equal(executions[0].correlation_id,'whatsapp:sales:MSG-1');
  assert.equal(executions[0].payload.kind,'text'); assert.equal(executions[0].payload.text,'beer');
});

test('Evolution Go webhook normalizes image, audio and document without owning media extraction',async()=>{
  const executions:any[]=[]; const ingress=new EvolutionGoWebhookIngress(api(executions),new InMemoryMessageIdStore(),secret,principal);
  await ingress.receive({'x-allascode-webhook-secret':secret},webhook({imageMessage:{url:'image',mimetype:'image/jpeg',caption:'receipt'}},'IMG'));
  await ingress.receive({'x-allascode-webhook-secret':secret},webhook({audioMessage:{url:'audio',mimetype:'audio/ogg'}},'AUD'));
  await ingress.receive({'x-allascode-webhook-secret':secret},webhook({documentMessage:{url:'doc',mimetype:'application/pdf',fileName:'receipt.pdf'}},'DOC'));
  assert.deepEqual(executions.map(x=>x.payload.kind),['image','audio','document']);
  assert.equal(executions[0].payload.media.mimetype,'image/jpeg'); assert.equal(executions[2].payload.media.fileName,'receipt.pdf');
});

test('Evolution Go status webhooks are recorded without invoking a domain Intent',async()=>{
  const executions:any[]=[]; const ingress=new EvolutionGoWebhookIngress(api(executions),new InMemoryMessageIdStore(),secret,principal);
  const result=await ingress.receive({'x-allascode-webhook-secret':secret},{event:'READ_RECEIPT',instance:'sales',data:{id:'OUT-1',status:'read'}});
  assert.equal(result.status,200); assert.equal(executions.length,0); assert.equal(ingress.delivery[0]?.message_id,'OUT-1'); assert.equal(ingress.delivery[0]?.event,'READ_RECEIPT');
});

test('Evolution Go outbound adapter uses documented apikey and send endpoints',async()=>{
  const requests:any[]=[];
  const fakeFetch=async(input:any,init:any)=>{requests.push({input,init});return new Response(JSON.stringify({message:'success',data:{Info:{ID:'OUT-42'}}}),{status:200,headers:{'content-type':'application/json'}});};
  const provider=new EvolutionGoProvider({baseUrl:'http://evo:4000',apiKey:'instance-key'},fakeFetch as any);
  assert.equal((await provider.sendText('5511','hello')).provider_message_id,'OUT-42');
  assert.equal((await provider.sendMedia({number:'5511',url:'https://x/r.pdf',type:'document',filename:'r.pdf'})).provider_message_id,'OUT-42');
  assert.equal(requests[0].input,'http://evo:4000/send/text'); assert.equal(requests[1].input,'http://evo:4000/send/media');
  assert.equal(requests[0].init.headers.apikey,'instance-key');
});
