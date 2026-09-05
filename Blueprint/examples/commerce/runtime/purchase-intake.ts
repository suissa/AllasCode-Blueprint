export type PurchaseEvidenceKind='text'|'audio'|'image'|'pix-receipt';
export type PurchaseEvidence={kind:PurchaseEvidenceKind;source_id:string;content:string};
export type PurchaseItem={product_ref:string;name:string;quantity:number;unit_price:number};
export type PurchaseFacts={supplier:{name:string;document?:string};items:PurchaseItem[];confidence:number;ambiguities:string[];evidence_ids:string[]};
export type PurchaseIntakeResult=
 |{outcome:'Ok';correlation_id:string;supplier_id:string;purchase:unknown}
 |{outcome:'Error';correlation_id:string;code:string;message:string;healing_required:boolean;missing:string[]};

export interface PurchaseUnderstandingPort{extract(evidence:PurchaseEvidence[],correlationId:string):Promise<PurchaseFacts>;}
export interface SupplierResolutionPort{resolveOrCreate(candidate:{name:string;document?:string},correlationId:string):Promise<{supplier_id:string;created:boolean}>;}
export interface PurchaseCommandPort{command(intent:'PurchaseProductsIntent',payload:Record<string,unknown>,correlationId:string,idempotencyKey:string):Promise<{outcome:'Ok'|'Error';data?:unknown;error?:{code:string;message:string}}>}
export interface PurchaseAuditPort{emit(event:{name:string;correlation_id:string;outcome:'Ok'|'Error';attributes:Record<string,unknown>}):Promise<void>|void;}

export class PurchaseIntakeCoordinator{
 constructor(private readonly understanding:PurchaseUnderstandingPort,private readonly suppliers:SupplierResolutionPort,private readonly commands:PurchaseCommandPort,private readonly audit:PurchaseAuditPort,private readonly confidenceThreshold=.85){}
 async intake(input:{message_id:string;correlation_id:string;evidence:PurchaseEvidence[]}):Promise<PurchaseIntakeResult>{
  if(input.evidence.length===0)return this.healing(input.correlation_id,'MISSING_EVIDENCE','Purchase evidence is required',['evidence']);
  let facts:PurchaseFacts;
  try{facts=await this.understanding.extract(input.evidence,input.correlation_id);}catch(error){return this.healing(input.correlation_id,'EXTRACTION_ERROR',error instanceof Error?error.message:String(error),['supplier','items']);}
  const missing:string[]=[];
  if(!facts.supplier.name.trim())missing.push('supplier');
  if(facts.items.length===0)missing.push('items');
  if(facts.items.some(x=>!x.name.trim()||x.quantity<=0||x.unit_price<=0))missing.push('quantity-or-unit-price');
  if(facts.confidence<this.confidenceThreshold||facts.ambiguities.length||missing.length){
   return this.healing(input.correlation_id,'PURCHASE_FACTS_NEED_CONFIRMATION','Purchase facts are incomplete or ambiguous',[...new Set([...missing,...facts.ambiguities])],{confidence:facts.confidence,evidence_ids:facts.evidence_ids});
  }
  const supplier=await this.suppliers.resolveOrCreate(facts.supplier,input.correlation_id);
  const result=await this.commands.command('PurchaseProductsIntent',{supplier_id:supplier.supplier_id,supplier_name:facts.supplier.name,items:facts.items,evidence_ids:facts.evidence_ids},input.correlation_id,input.message_id);
  if(result.outcome==='Error'){
   await this.audit.emit({name:'PurchaseIntake.Error',correlation_id:input.correlation_id,outcome:'Error',attributes:{code:result.error?.code??'PurchaseProductsError',supplier_id:supplier.supplier_id,evidence_ids:facts.evidence_ids}});
   return{outcome:'Error',correlation_id:input.correlation_id,code:result.error?.code??'PurchaseProductsError',message:result.error?.message??'Purchase could not be completed',healing_required:true,missing:[]};
  }
  await this.audit.emit({name:'PurchaseIntake.Ok',correlation_id:input.correlation_id,outcome:'Ok',attributes:{supplier_id:supplier.supplier_id,supplier_created:supplier.created,evidence_ids:facts.evidence_ids,item_count:facts.items.length}});
  return{outcome:'Ok',correlation_id:input.correlation_id,supplier_id:supplier.supplier_id,purchase:result.data};
 }
 private async healing(correlation_id:string,code:string,message:string,missing:string[],extra:Record<string,unknown>={}):Promise<PurchaseIntakeResult>{
  await this.audit.emit({name:'PurchaseIntake.Error',correlation_id,outcome:'Error',attributes:{code,missing,...extra}});
  return{outcome:'Error',correlation_id,code,message,healing_required:true,missing};
 }
}

// Supplier resolution happens before PurchaseProductsIntent, but all purchase/stock/financial effects remain owned by the existing semantic flow.
