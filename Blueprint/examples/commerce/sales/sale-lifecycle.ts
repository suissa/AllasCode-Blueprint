export type SaleProduct={product_id:string;label:string;quantity:number;unit_price?:number};
export type SaleEvent={event_id:string;sale_id:string;amount:number;currency:string;products?:SaleProduct[]};
export type SaleLifecycleResult=
 |{outcome:'Ok';sale_id:string;status:'closed';products:SaleProduct[]}
 |{outcome:'Pending';sale_id:string;reason:'products-unresolved'|'insufficient-stock'|'amount-mismatch'|'invalid-products'};

export interface SaleInventoryPort{available(productId:string):Promise<number>|number;}
export interface SaleEffectsPort{process(input:{sale_id:string;amount:number;currency:string;products:SaleProduct[];idempotency_key:string;correlation_id:string}):Promise<{outcome:'Ok'}|{outcome:'Error';code:string}>;}
export interface SaleHealingPort{request(input:{sale_id:string;reason:string;context:Record<string,unknown>}):Promise<void>|void;}
export interface SaleAuditPort{record(event:{type:'SaleLifecycle.Ok'|'SaleLifecycle.Error';sale_id:string;correlation_id:string;reason?:string}):Promise<void>|void;}

export class SaleLifecycleCoordinator{
 private readonly seen=new Set<string>();
 constructor(private readonly inventory:SaleInventoryPort,private readonly effects:SaleEffectsPort,private readonly healing:SaleHealingPort,private readonly audit:SaleAuditPort){}

 async handle(event:SaleEvent):Promise<SaleLifecycleResult>{
  const correlationId=`sale:${event.sale_id}`;
  if(this.seen.has(event.event_id))return{outcome:'Pending',sale_id:event.sale_id,reason:'products-unresolved'};
  if(!event.products?.length)return this.pending(event,'products-unresolved',correlationId,{amount:event.amount,currency:event.currency});
  if(event.products.some(p=>!p.product_id||!p.label||!Number.isInteger(p.quantity)||p.quantity<=0||p.unit_price!==undefined&&p.unit_price<=0))return this.pending(event,'invalid-products',correlationId,{products:event.products});
  const priced=event.products.every(p=>p.unit_price!==undefined);
  if(priced){const total=event.products.reduce((sum,p)=>sum+p.quantity*(p.unit_price??0),0);if(Math.abs(total-event.amount)>0.01)return this.pending(event,'amount-mismatch',correlationId,{expected:total,received:event.amount,products:event.products});}
  for(const product of event.products){const available=await this.inventory.available(product.product_id);if(available<product.quantity)return this.pending(event,'insufficient-stock',correlationId,{product_id:product.product_id,requested:product.quantity,available});}
  const result=await this.effects.process({sale_id:event.sale_id,amount:event.amount,currency:event.currency,products:event.products,idempotency_key:`sale-effect:${event.event_id}`,correlation_id:correlationId});
  if(result.outcome==='Error')return this.pending(event,'invalid-products',correlationId,{effect_error:result.code});
  this.seen.add(event.event_id);
  await this.audit.record({type:'SaleLifecycle.Ok',sale_id:event.sale_id,correlation_id:correlationId});
  return{outcome:'Ok',sale_id:event.sale_id,status:'closed',products:event.products};
 }

 private async pending(event:SaleEvent,reason:SaleLifecycleResult extends {outcome:'Pending';reason:infer R}?R:never,correlationId:string,context:Record<string,unknown>):Promise<SaleLifecycleResult>{
  await this.healing.request({sale_id:event.sale_id,reason,context});
  await this.audit.record({type:'SaleLifecycle.Error',sale_id:event.sale_id,correlation_id:correlationId,reason});
  return{outcome:'Pending',sale_id:event.sale_id,reason};
 }
}
