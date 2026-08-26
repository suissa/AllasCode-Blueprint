export type InventoryMovementKind='purchase'|'sale'|'adjustment'|'reconciliation';
export type InventoryMovement={movement_id:string;product_id:string;kind:InventoryMovementKind;delta:number;balance_after:number;reason?:string;correlation_id:string;idempotency_key:string;operator_id?:string;at:string};
export type InventoryProduct={product_id:string;balance:number;minimum_stock:number;allow_negative:boolean};
export type InventoryPolicyContext={operator_id?:string;capabilities:string[]};
export type InventoryAdjustmentResult={outcome:'Ok';product:InventoryProduct;movement:InventoryMovement;duplicate?:true}|{outcome:'Error';code:'Unauthorized'|'ReasonRequired'|'NegativeStockForbidden'|'InvalidDelta'|'ProductNotFound'};
export type InventoryReconciliationRow={product_id:string;stored_balance:number;ledger_balance:number;difference:number;consistent:boolean};

export interface InventoryPolicyPort{canAdjust(context:InventoryPolicyContext,product:InventoryProduct,delta:number):Promise<boolean>|boolean;}

class KeyedSerialExecutor{
 private readonly tails=new Map<string,Promise<void>>();
 async run<T>(key:string,task:()=>Promise<T>):Promise<T>{
  const previous=this.tails.get(key)??Promise.resolve();
  let release!:()=>void;
  const current=new Promise<void>(resolve=>{release=resolve;});
  this.tails.set(key,previous.then(()=>current));
  await previous;
  try{return await task();}finally{release();if(this.tails.get(key)===current)this.tails.delete(key);}
 }
}

export class InventoryManagement{
 private readonly products=new Map<string,InventoryProduct>();
 private readonly movements:InventoryMovement[]=[];
 private readonly idempotency=new Map<string,InventoryMovement>();
 private readonly locks=new KeyedSerialExecutor();
 constructor(private readonly policy:InventoryPolicyPort,seed:InventoryProduct[]=[]){for(const product of seed)this.products.set(product.product_id,{...product});}

 product(product_id:string){const p=this.products.get(product_id);return p?{...p}:undefined;}
 list(){return [...this.products.values()].map(p=>({...p}));}
 history(product_id?:string){return this.movements.filter(m=>!product_id||m.product_id===product_id).map(m=>({...m}));}
 lowStockAlerts(){return this.list().filter(p=>p.balance<=p.minimum_stock).map(p=>({product_id:p.product_id,balance:p.balance,minimum_stock:p.minimum_stock}));}
 register(product:InventoryProduct){if(!Number.isFinite(product.balance)||!Number.isFinite(product.minimum_stock)||product.minimum_stock<0)throw new Error('InvalidInventoryProduct');this.products.set(product.product_id,{...product});}

 async applyDomainMovement(input:{product_id:string;delta:number;kind:'purchase'|'sale';correlation_id:string;idempotency_key:string}):Promise<InventoryAdjustmentResult>{
  return this.mutate({...input,reason:input.kind,context:{capabilities:['inventory.domain-mutation']}});
 }
 async adjust(input:{product_id:string;delta:number;reason:string;correlation_id:string;idempotency_key:string;context:InventoryPolicyContext}):Promise<InventoryAdjustmentResult>{
  if(!input.reason.trim())return{outcome:'Error',code:'ReasonRequired'};
  return this.mutate({...input,kind:'adjustment'});
 }

 private async mutate(input:{product_id:string;delta:number;kind:InventoryMovementKind;reason:string;correlation_id:string;idempotency_key:string;context:InventoryPolicyContext}):Promise<InventoryAdjustmentResult>{
  if(!Number.isFinite(input.delta)||input.delta===0)return{outcome:'Error',code:'InvalidDelta'};
  const duplicate=this.idempotency.get(input.idempotency_key);
  if(duplicate){const product=this.products.get(duplicate.product_id);if(!product)return{outcome:'Error',code:'ProductNotFound'};return{outcome:'Ok',product:{...product},movement:{...duplicate},duplicate:true};}
  return this.locks.run(input.product_id,async()=>{
   const duplicateInside=this.idempotency.get(input.idempotency_key);
   if(duplicateInside){const p=this.products.get(duplicateInside.product_id);if(!p)return{outcome:'Error',code:'ProductNotFound'};return{outcome:'Ok' as const,product:{...p},movement:{...duplicateInside},duplicate:true as const};}
   const product=this.products.get(input.product_id);if(!product)return{outcome:'Error' as const,code:'ProductNotFound' as const};
   if(input.kind==='adjustment'&&!(await this.policy.canAdjust(input.context,product,input.delta)))return{outcome:'Error' as const,code:'Unauthorized' as const};
   const next=product.balance+input.delta;
   if(next<0&&!product.allow_negative)return{outcome:'Error' as const,code:'NegativeStockForbidden' as const};
   product.balance=next;
   const movement:InventoryMovement={movement_id:`mov-${this.movements.length+1}`,product_id:product.product_id,kind:input.kind,delta:input.delta,balance_after:next,reason:input.reason,correlation_id:input.correlation_id,idempotency_key:input.idempotency_key,at:new Date().toISOString()};
   if(input.context.operator_id!==undefined)movement.operator_id=input.context.operator_id;
   this.movements.push(movement);this.idempotency.set(input.idempotency_key,movement);
   return{outcome:'Ok' as const,product:{...product},movement:{...movement}};
  });
 }

 reconciliation():InventoryReconciliationRow[]{
  return this.list().map(product=>{const relevant=this.movements.filter(m=>m.product_id===product.product_id);const ledger_balance=relevant.length?relevant.at(-1)!.balance_after:product.balance;const difference=product.balance-ledger_balance;return{product_id:product.product_id,stored_balance:product.balance,ledger_balance,difference,consistent:difference===0};});
 }
}
