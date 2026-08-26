import test from 'node:test';
import assert from 'node:assert/strict';
import {E2EProductSystem} from '../runtime/e2e-product-system.js';
import {PurchaseIntakeCoordinator,type PurchaseAuditPort,type PurchaseCommandPort,type PurchaseEvidence,type PurchaseFacts,type PurchaseUnderstandingPort,type SupplierResolutionPort} from '../runtime/purchase-intake.js';

class Understanding implements PurchaseUnderstandingPort{
 facts:PurchaseFacts={supplier:{name:'Mercado Central',document:'doc-1'},items:[{product_ref:'beer',name:'beer',quantity:2,unit_price:5}],confidence:.98,ambiguities:[],evidence_ids:['audio-1','img-1','pix-1','text-1']};
 seenKinds:string[]=[];
 async extract(evidence:PurchaseEvidence[]){this.seenKinds=evidence.map(x=>x.kind);return structuredClone(this.facts);}
}
class Suppliers implements SupplierResolutionPort{
 readonly ids=new Map<string,string>();created=0;
 async resolveOrCreate(candidate:{name:string;document?:string}){const key=candidate.document?.trim().toLowerCase()||candidate.name.trim().toLowerCase();let id=this.ids.get(key);let created=false;if(!id){id=`supplier-${this.ids.size+1}`;this.ids.set(key,id);this.created++;created=true;}return{supplier_id:id,created};}
}
class E2ECommands implements PurchaseCommandPort{
 calls=0;constructor(readonly system:E2EProductSystem){}
 async command(_intent:'PurchaseProductsIntent',payload:Record<string,unknown>,correlationId:string,idempotencyKey:string){this.calls++;const items=payload.items as Array<{name:string;quantity:number;unit_price:number}>;this.system.purchaseFromWhatsApp({message_id:idempotencyKey,conversation_id:correlationId,audio_text:'resolved evidence',receipt:{supplier:String(payload.supplier_name),items}});const purchase=this.system.uiProjection().purchases.find(x=>x.id===correlationId);return purchase?{outcome:'Ok' as const,data:purchase}:{outcome:'Error' as const,error:{code:'PurchaseProductsError',message:'not completed'}};}
}
class Audit implements PurchaseAuditPort{events:Array<{name:string;correlation_id:string;outcome:'Ok'|'Error';attributes:Record<string,unknown>}>=[];emit(event:{name:string;correlation_id:string;outcome:'Ok'|'Error';attributes:Record<string,unknown>}){this.events.push(event);}}
function evidence():PurchaseEvidence[]{return[{kind:'text',source_id:'text-1',content:'2 cervejas a 5'},{kind:'audio',source_id:'audio-1',content:'audio-ref'},{kind:'image',source_id:'img-1',content:'receipt-image-ref'},{kind:'pix-receipt',source_id:'pix-1',content:'pix-receipt-ref'}];}
function harness(){const understanding=new Understanding();const suppliers=new Suppliers();const system=new E2EProductSystem();const commands=new E2ECommands(system);const audit=new Audit();return{coordinator:new PurchaseIntakeCoordinator(understanding,suppliers,commands,audit),understanding,suppliers,system,commands,audit};}

test('text audio image and Pix evidence resolve supplier then reach purchase stock financial and UI',async()=>{const h=harness();const result=await h.coordinator.intake({message_id:'purchase-msg-1',correlation_id:'purchase-1',evidence:evidence()});assert.equal(result.outcome,'Ok');assert.deepEqual(h.understanding.seenKinds,['text','audio','image','pix-receipt']);assert.equal(h.suppliers.created,1);const ui=h.system.uiProjection();assert.equal(ui.inventory.find(x=>x.product==='beer')?.stock,12);assert.equal(ui.financial.expense,10);assert.equal(ui.purchases[0]?.supplier,'Mercado Central');assert.equal(h.audit.events.at(-1)?.name,'PurchaseIntake.Ok');});

test('supplier canonical identity is resolved without duplicate creation',async()=>{const h=harness();await h.coordinator.intake({message_id:'p1',correlation_id:'corr-1',evidence:evidence()});await h.coordinator.intake({message_id:'p2',correlation_id:'corr-2',evidence:evidence()});assert.equal(h.suppliers.created,1);assert.equal(h.suppliers.ids.size,1);});

test('duplicate intake message is idempotent for stock and expense',async()=>{const h=harness();const input={message_id:'same-message',correlation_id:'dup-purchase',evidence:evidence()};await h.coordinator.intake(input);await h.coordinator.intake(input);assert.equal(h.system.state.products.beer?.stock,12);assert.equal(h.system.state.financial.expense,10);assert.equal(Object.keys(h.system.state.purchases).length,1);});

test('missing evidence emits auditable Error and never enters domain flow',async()=>{const h=harness();const result=await h.coordinator.intake({message_id:'missing',correlation_id:'missing-corr',evidence:[]});assert.equal(result.outcome,'Error');if(result.outcome==='Error'){assert.equal(result.healing_required,true);assert.ok(result.missing.includes('evidence'));}assert.equal(h.commands.calls,0);assert.equal(h.audit.events[0]?.outcome,'Error');});

test('low confidence or ambiguity enters healing before supplier creation or domain effects',async()=>{const h=harness();h.understanding.facts={...h.understanding.facts,confidence:.62,ambiguities:['unit_price']};const result=await h.coordinator.intake({message_id:'ambiguous',correlation_id:'heal-corr',evidence:evidence()});assert.equal(result.outcome,'Error');if(result.outcome==='Error'){assert.equal(result.code,'PURCHASE_FACTS_NEED_CONFIRMATION');assert.ok(result.missing.includes('unit_price'));}assert.equal(h.suppliers.created,0);assert.equal(h.commands.calls,0);assert.equal(h.system.state.financial.expense,0);});

test('invalid quantity or unit price cannot reach PurchaseProductsIntent even at high confidence',async()=>{const h=harness();h.understanding.facts={...h.understanding.facts,items:[{product_ref:'beer',name:'beer',quantity:2,unit_price:0}]};const result=await h.coordinator.intake({message_id:'invalid-price',correlation_id:'price-corr',evidence:evidence()});assert.equal(result.outcome,'Error');assert.equal(h.commands.calls,0);});
