import test from 'node:test';
import assert from 'node:assert/strict';
import { WhatsAppConversationOrchestrator, InMemoryConversationStore, type ConversationReplyPort } from '../api/whatsapp-conversation-orchestrator.js';

type Execution={intent:string;payload:any;correlation_id:string;idempotency_key:string;principal_id:string};
function harness(now='2026-08-26T08:00:00.000Z'){
  const executions:Execution[]=[];const replies:Array<{instance:string;to:string;text:string;correlation_id:string}>=[];
  const domain={async execute(input:Execution){executions.push(input);return{outcome:'Ok' as const,data:{reply:`semantic:${input.intent}`}};}};
  const store=new InMemoryConversationStore();
  const replyPort:ConversationReplyPort={async sendText(input){replies.push(input);return{provider_message_id:'OUT'};}};
  let current=new Date(now);
  const clock={now:()=>new Date(current)};
  const orchestrator=new WhatsAppConversationOrchestrator(domain,store,replyPort,{id:'whatsapp-conversation',permissions:['*']},30*60*1000,clock);
  return{orchestrator,store,executions,replies,clock,setNow:(value:string)=>{current=new Date(value);}};
}
function inbound(text:string,id:string,from='5511999999999@s.whatsapp.net',instance='sales'){return{intent:'WhatsAppInboundMessageIntent',payload:{provider:'evolution-go',instance,message_id:id,from,kind:'text' as const,text},correlation_id:`whatsapp:${instance}:${id}`,idempotency_key:id,principal_id:'whatsapp:evolution-go'};}

test('unknown business context triggers clarification instead of inventing an Intent',async()=>{
  const h=harness();const result=await h.orchestrator.execute(inbound('preciso de ajuda','M1'));
  assert.equal(result.outcome,'Ok');assert.equal((result.data as any).state,'waiting-human');assert.equal(h.executions.length,0);
  assert.match(h.replies[0]?.text??'',/compra de fornecedor.*venda/i);
});

test('purchase conversation accumulates context across messages then dispatches PurchaseProductsIntent',async()=>{
  const h=harness();await h.orchestrator.execute(inbound('Comprei mercadoria do fornecedor','M1'));
  assert.equal(h.executions.length,0);
  await h.orchestrator.execute(inbound(JSON.stringify({purchase_id:'p-wa-1',supplier_id:'supplier-1',supplier_name:'Mercado',currency:'BRL',items:[{product_id:'beer',name:'Beer',quantity:10,unit_price:3}]}),'M2'));
  assert.equal(h.executions.length,1);assert.equal(h.executions[0]?.intent,'PurchaseProductsIntent');assert.equal(h.executions[0]?.payload.purchase_id,'p-wa-1');
  assert.equal((await h.store.load('whatsapp:sales:5511999999999'))?.status,'completed');
});

test('sale resolution waits for products and then dispatches ProcessSaleIntent',async()=>{
  const h=harness();await h.orchestrator.execute(inbound('Venda da maquininha','S1'));
  await h.orchestrator.execute(inbound(JSON.stringify({sale_id:'sale-wa-1',currency:'BRL',items:[{product_id:'beer',name:'Beer',quantity:2,unit_price:6}]}),'S2'));
  assert.equal(h.executions.length,1);assert.equal(h.executions[0]?.intent,'ProcessSaleIntent');assert.equal(h.executions[0]?.payload.items[0].quantity,2);
});

test('conversation store is external to orchestrator so a new runtime instance resumes the same session',async()=>{
  const first=harness();await first.orchestrator.execute(inbound('Comprei no fornecedor','R1'));
  const replies:Array<any>=[];const executions:Execution[]=[];
  const second=new WhatsAppConversationOrchestrator({async execute(input:Execution){executions.push(input);return{outcome:'Ok' as const,data:{reply:'ok'}};}},first.store,{async sendText(input){replies.push(input);return{};}},{id:'conversation',permissions:['*']},30*60*1000,first.clock);
  await second.execute(inbound(JSON.stringify({purchase_id:'p2',supplier_id:'s2',items:[{product_id:'water',name:'Water',quantity:5,unit_price:2}],currency:'BRL'}),'R2'));
  assert.equal(executions[0]?.intent,'PurchaseProductsIntent');
});

test('timeout starts a fresh conversation and does not reuse stale business context',async()=>{
  const h=harness();await h.orchestrator.execute(inbound('Comprei no fornecedor','T1'));
  h.setNow('2026-08-26T08:31:00.000Z');
  const result=await h.orchestrator.execute(inbound(JSON.stringify({purchase_id:'old',supplier_id:'s',items:[{product_id:'x',name:'X',quantity:1,unit_price:1}]}),'T2'));
  assert.equal(h.executions.length,0);assert.equal((result.data as any).state,'waiting-human');
  assert.match(h.replies.at(-1)?.text??'',/intenção/i);
});

test('provider name has no domain authority; orchestration depends on normalized channel fields only',async()=>{
  const h=harness();const message=inbound('Venda da maquininha','P1');(message.payload as any).provider='another-provider';
  await h.orchestrator.execute(message);assert.equal(h.executions.length,0);assert.match(h.replies[0]?.text??'',/produtos vendidos|identificador da venda/i);
});
