import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryConversationStore, WhatsAppConversationOrchestrator, type WhatsAppInboundMessage } from '../api/whatsapp-conversation-orchestrator.js';
import { FunctionAudioTranscriptionAdapter, FunctionReceiptExtractionAdapter, InMemoryMediaEvidenceStore, JsonTextCandidateExtractor, WhatsAppSemanticUnderstanding } from '../api/whatsapp-semantic-understanding.js';

const principal={id:'whatsapp:semantic',permissions:['*']};
function message(kind:WhatsAppInboundMessage['kind'],id:string,text?:string):WhatsAppInboundMessage{return{provider:'test-provider',instance:'commerce',message_id:id,from:'5511999999999@s.whatsapp.net',kind,...(text?{text}:{}),...(kind==='text'?{}:{media:{url:`https://media/${id}`},raw:{provider_raw:id}})};}
function replies(){const sent:any[]=[];return{sent,port:{async sendText(input:any){sent.push(input);return{provider_message_id:`OUT-${sent.length}`};}}};}
function domain(){const calls:any[]=[];return{calls,runtime:{async execute(input:any){calls.push(input);return{outcome:'Ok' as const,data:{message:'semantic ok'}};}}};}

function understanding(options?:{
  audio?:{text:string;confidence:number;ambiguities?:string[]};
  receipt?:{text?:string;fields:Record<string,unknown>;field_confidence?:Record<string,number>;ambiguities?:string[]};
  threshold?:number;
}){
  const evidence=new InMemoryMediaEvidenceStore();
  const audio=new FunctionAudioTranscriptionAdapter(async()=>options?.audio??{text:'{}',confidence:1});
  const receipt=new FunctionReceiptExtractionAdapter(async()=>options?.receipt??{fields:{}});
  return{evidence,port:new WhatsAppSemanticUnderstanding(evidence,audio,receipt,new JsonTextCandidateExtractor(),options?.threshold??0.8)};
}

test('noisy audio remains traceable candidate and requests human confirmation',async()=>{
  const d=domain(),r=replies(),u=understanding({audio:{text:'{"sale_id":"sale-9","items":[{"product_id":"beer","quantity":2,"unit_price":6}]}',confidence:0.54,ambiguities:['audio noisy around product quantity']}});
  const orchestrator=new WhatsAppConversationOrchestrator(d.runtime,new InMemoryConversationStore(),r.port,principal,1800000,{now:()=>new Date('2026-08-26T08:00:00Z')},u.port);
  await orchestrator.execute({intent:'WhatsAppInboundMessageIntent',payload:message('text','T1','venda'),correlation_id:'c1',idempotency_key:'T1',principal_id:'channel'});
  const result=await orchestrator.execute({intent:'WhatsAppInboundMessageIntent',payload:message('audio','A1'),correlation_id:'c2',idempotency_key:'A1',principal_id:'channel'});
  assert.equal(result.outcome,'Ok');assert.equal(d.calls.length,0);assert.match(r.sent.at(-1).text,/confirmar a extração/i);
  const saved=await u.evidence.load('whatsapp-evidence:commerce:A1');assert.equal(saved?.kind,'audio');assert.equal(saved?.confidence,0.54);assert.equal((saved?.original_payload as any)?.provider_raw,'A1');
});

test('partial receipt never invents missing commercial fields',async()=>{
  const d=domain(),r=replies(),u=understanding({receipt:{text:'SUPERMERCADO X',fields:{supplier_name:'Supermercado X'},field_confidence:{supplier_name:0.97},ambiguities:['items missing from cropped receipt']}});
  const orchestrator=new WhatsAppConversationOrchestrator(d.runtime,new InMemoryConversationStore(),r.port,principal,1800000,{now:()=>new Date('2026-08-26T08:00:00Z')},u.port);
  await orchestrator.execute({intent:'WhatsAppInboundMessageIntent',payload:message('image','IMG1','comprovante da compra'),correlation_id:'c',idempotency_key:'IMG1',principal_id:'channel'});
  assert.equal(d.calls.length,0);assert.match(r.sent.at(-1).text,/items missing/i);
  const saved=await u.evidence.load('whatsapp-evidence:commerce:IMG1');assert.deepEqual(saved?.candidates.map(x=>x.field),['supplier_name']);
});

test('wrong units are explicit ambiguity and cannot reach domain intent',async()=>{
  const d=domain(),r=replies(),u=understanding({receipt:{fields:{purchase_id:'p-unit',supplier_name:'Market',items:[{product_id:'beer',quantity:12,unit:'kg',unit_price:3}]},field_confidence:{purchase_id:0.99,supplier_name:0.99,items:0.91},ambiguities:['items unit kg conflicts with beverage unit']}});
  const orchestrator=new WhatsAppConversationOrchestrator(d.runtime,new InMemoryConversationStore(),r.port,principal,1800000,{now:()=>new Date('2026-08-26T08:00:00Z')},u.port);
  await orchestrator.execute({intent:'WhatsAppInboundMessageIntent',payload:message('document','DOC1','nota da compra'),correlation_id:'c',idempotency_key:'DOC1',principal_id:'channel'});
  assert.equal(d.calls.length,0);assert.match(r.sent.at(-1).text,/unit kg/i);
});

test('ambiguous products stay candidates until human correction',async()=>{
  const d=domain(),r=replies(),u=understanding({receipt:{fields:{purchase_id:'p-amb',supplier_name:'Market',items:[{name:'Coca',quantity:2,unit_price:8}]},field_confidence:{purchase_id:0.99,supplier_name:0.99,items:0.62},ambiguities:['items product Coca may mean 2L or 600ml']}});
  const store=new InMemoryConversationStore();const orchestrator=new WhatsAppConversationOrchestrator(d.runtime,store,r.port,principal,1800000,{now:()=>new Date('2026-08-26T08:00:00Z')},u.port);
  await orchestrator.execute({intent:'WhatsAppInboundMessageIntent',payload:message('image','IMG2','comprovante compra'),correlation_id:'c',idempotency_key:'IMG2',principal_id:'channel'});
  const session=await store.load('whatsapp:commerce:5511999999999');
  assert.equal(d.calls.length,0);assert.equal((session?.context.pending_extraction as any).confidence,0.62);assert.equal(session?.context.items,undefined);
});

test('high-confidence extraction becomes candidate payload only at semantic domain boundary',async()=>{
  const d=domain(),r=replies(),u=understanding({receipt:{text:'Market receipt',fields:{purchase_id:'p-ok',supplier_name:'Market',currency:'BRL',items:[{product_id:'beer',name:'Beer',quantity:10,unit_price:3}]},field_confidence:{purchase_id:0.99,supplier_name:0.98,currency:0.99,items:0.95}}});
  const orchestrator=new WhatsAppConversationOrchestrator(d.runtime,new InMemoryConversationStore(),r.port,principal,1800000,{now:()=>new Date('2026-08-26T08:00:00Z')},u.port);
  const result=await orchestrator.execute({intent:'WhatsAppInboundMessageIntent',payload:message('image','IMG3','comprovante compra'),correlation_id:'c-ok',idempotency_key:'IMG3',principal_id:'channel'});
  assert.equal(result.outcome,'Ok');assert.equal(d.calls.length,1);assert.equal(d.calls[0].intent,'PurchaseProductsIntent');assert.equal(d.calls[0].payload.purchase_id,'p-ok');assert.equal(d.calls[0].payload.extraction_evidence[0].evidence_id,'whatsapp-evidence:commerce:IMG3');
  const saved=await u.evidence.load('whatsapp-evidence:commerce:IMG3');assert.equal(saved?.original_media?.url,'https://media/IMG3');assert.equal(saved?.confidence,0.95);
});
