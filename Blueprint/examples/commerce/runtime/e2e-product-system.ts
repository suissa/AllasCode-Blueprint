export type ProductState={stock:number};
export type SaleState={status:'pending'|'closed';amount:number;products:string[]};
export type PurchaseState={status:'pending'|'completed';supplier:string;products:Array<{name:string;quantity:number;unit_price:number}>;expense:number};
export type PersistedState={products:Record<string,ProductState>;sales:Record<string,SaleState>;purchases:Record<string,PurchaseState>;financial:{income:number;expense:number};events:Array<{id:string;type:string;correlation_id:string}>;idempotency:Set<string>;conversations:Record<string,{kind:'purchase'|'sale';pending:boolean;context:Record<string,unknown>}>};
export type SemanticEvidence={scenario:string;policies:string[];invariants:string[];laws:string[]};

export function createPersistedState():PersistedState{return{products:{beer:{stock:10}},sales:{},purchases:{},financial:{income:0,expense:0},events:[],idempotency:new Set(),conversations:{}};}
function emit(state:PersistedState,type:string,correlation_id:string){state.events.push({id:`evt-${state.events.length+1}`,type,correlation_id});}
function once(state:PersistedState,key:string,fn:()=>void){if(state.idempotency.has(key))return false;state.idempotency.add(key);fn();return true;}

export class E2EProductSystem{
 readonly evidence:SemanticEvidence[]=[];
 constructor(readonly state:PersistedState=createPersistedState()){}

 purchaseFromWhatsApp(input:{message_id:string;conversation_id:string;audio_text:string;receipt:{supplier:string;items:Array<{name:string;quantity:number;unit_price:number}>}}){
  return once(this.state,input.message_id,()=>{const items=input.receipt.items;const ambiguous=!input.audio_text||!items.length||items.some(x=>x.quantity<=0||x.unit_price<=0);if(ambiguous){this.state.conversations[input.conversation_id]={kind:'purchase',pending:true,context:{...input}};emit(this.state,'PurchaseNeedsHumanConfirmation',input.conversation_id);return;}
   const total=items.reduce((n,x)=>n+x.quantity*x.unit_price,0);this.state.purchases[input.conversation_id]={status:'completed',supplier:input.receipt.supplier,products:items,expense:total};for(const item of items){const key=item.name.toLowerCase();this.state.products[key]??={stock:0};this.state.products[key]!.stock+=item.quantity;}this.state.financial.expense+=total;emit(this.state,'PurchaseCompleted',input.conversation_id);this.evidence.push({scenario:'purchase',policies:['WhatsApp provider is transport only','PurchaseProductsIntent validates resolved facts'],invariants:['stock increases exactly once','expense equals accepted purchase total'],laws:['idempotent message handling','no domain effect before valid evidence']});});
 }

 detectSale(input:{provider_event_id:string;sale_id:string;amount:number}){return once(this.state,input.provider_event_id,()=>{this.state.sales[input.sale_id]={status:'pending',amount:input.amount,products:[]};this.state.conversations[input.sale_id]={kind:'sale',pending:true,context:{amount:input.amount}};emit(this.state,'SaleIdentified',input.sale_id);});}
 answerSale(input:{message_id:string;sale_id:string;products:Array<{name:string;quantity:number}>}){return once(this.state,input.message_id,()=>{const sale=this.state.sales[input.sale_id];if(!sale||sale.status==='closed')return;for(const p of input.products){const key=p.name.toLowerCase();const product=this.state.products[key];if(!product||product.stock<p.quantity){this.state.conversations[input.sale_id]={kind:'sale',pending:true,context:{products:input.products,reason:'insufficient-or-unknown-stock'}};emit(this.state,'SaleNeedsHumanConfirmation',input.sale_id);return;}}
   for(const p of input.products)this.state.products[p.name.toLowerCase()]!.stock-=p.quantity;sale.products=input.products.flatMap(p=>Array(p.quantity).fill(p.name));sale.status='closed';this.state.financial.income+=sale.amount;this.state.conversations[input.sale_id]={kind:'sale',pending:false,context:{}};emit(this.state,'SaleClosed',input.sale_id);this.evidence.push({scenario:'sale',policies:['ProcessSaleIntent owns sale resolution'],invariants:['stock never becomes negative','financial income is applied once'],laws:['duplicate provider events have no duplicate effect']});});}

 confirmHuman(input:{message_id:string;conversation_id:string;correction:{receipt?:{supplier:string;items:Array<{name:string;quantity:number;unit_price:number}>};audio_text?:string;products?:Array<{name:string;quantity:number}>}}){const c=this.state.conversations[input.conversation_id];if(!c||!c.pending)return false;if(c.kind==='purchase'&&input.correction.receipt){const original=c.context as any;delete this.state.conversations[input.conversation_id];return this.purchaseFromWhatsApp({message_id:input.message_id,conversation_id:input.conversation_id,audio_text:input.correction.audio_text??original.audio_text??'confirmed',receipt:input.correction.receipt});}if(c.kind==='sale'&&input.correction.products)return this.answerSale({message_id:input.message_id,sale_id:input.conversation_id,products:input.correction.products});return false;}

 uiProjection(){return{inventory:Object.entries(this.state.products).map(([product,v])=>({product,stock:v.stock})),purchases:Object.entries(this.state.purchases).map(([id,v])=>({id,...v})),sales:Object.entries(this.state.sales).map(([id,v])=>({id,...v})),financial:{...this.state.financial},healing:Object.entries(this.state.conversations).filter(([,v])=>v.pending).map(([id,v])=>({id,kind:v.kind}))};}
 restart(){return new E2EProductSystem(this.state);}
}
