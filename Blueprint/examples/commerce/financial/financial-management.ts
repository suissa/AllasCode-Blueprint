export type PaymentStatus='pending'|'confirmed'|'failed'|'refunded'|'cancelled';
export type FinancialDirection='income'|'expense';
export type BusinessEventKind='purchase'|'sale';
export type FinancialEntry={entry_id:string;business_event_id:string;kind:BusinessEventKind;direction:FinancialDirection;amount:number;occurred_at:string;correlation_id:string;idempotency_key:string};
export type Payment={payment_id:string;business_event_id:string;amount:number;status:PaymentStatus;method?:string;occurred_at:string;correlation_id:string;idempotency_key:string};
export type ReconciliationRow={business_event_id:string;expected_amount:number;confirmed_amount:number;difference:number;payment_ids:string[];status:'matched'|'unmatched'|'partial'|'overpaid'};

export class FinancialManagement{
 private readonly entries:FinancialEntry[]=[];
 private readonly payments=new Map<string,Payment>();
 private readonly eventKeys=new Set<string>();
 private readonly paymentKeys=new Map<string,string>();

 recordBusinessEvent(input:{business_event_id:string;kind:BusinessEventKind;amount:number;occurred_at:string;correlation_id:string;idempotency_key:string}):{outcome:'Ok';entry:FinancialEntry;duplicate?:true}|{outcome:'Error';code:'InvalidAmount'}{
  if(!Number.isFinite(input.amount)||input.amount<=0)return{outcome:'Error',code:'InvalidAmount'};
  const existing=this.entries.find(e=>e.idempotency_key===input.idempotency_key);
  if(existing)return{outcome:'Ok',entry:{...existing},duplicate:true};
  const entry:FinancialEntry={entry_id:`fin-${this.entries.length+1}`,business_event_id:input.business_event_id,kind:input.kind,direction:input.kind==='sale'?'income':'expense',amount:input.amount,occurred_at:input.occurred_at,correlation_id:input.correlation_id,idempotency_key:input.idempotency_key};
  this.entries.push(entry);this.eventKeys.add(input.idempotency_key);return{outcome:'Ok',entry:{...entry}};
 }

 recordPayment(input:{payment_id:string;business_event_id:string;amount:number;status:PaymentStatus;method?:string;occurred_at:string;correlation_id:string;idempotency_key:string}):{outcome:'Ok';payment:Payment;duplicate?:true}|{outcome:'Error';code:'InvalidAmount'|'InvalidTransition'}{
  if(!Number.isFinite(input.amount)||input.amount<=0)return{outcome:'Error',code:'InvalidAmount'};
  const duplicateId=this.paymentKeys.get(input.idempotency_key);if(duplicateId){const p=this.payments.get(duplicateId)!;return{outcome:'Ok',payment:{...p},duplicate:true};}
  const current=this.payments.get(input.payment_id);
  if(current&&!this.canTransition(current.status,input.status))return{outcome:'Error',code:'InvalidTransition'};
  const payment:Payment={...input};this.payments.set(input.payment_id,payment);this.paymentKeys.set(input.idempotency_key,input.payment_id);return{outcome:'Ok',payment:{...payment}};
 }

 private canTransition(from:PaymentStatus,to:PaymentStatus){if(from===to)return true;const allowed:Record<PaymentStatus,PaymentStatus[]>={pending:['confirmed','failed','cancelled'],confirmed:['refunded','cancelled'],failed:[],refunded:[],cancelled:[]};return allowed[from].includes(to);}
 ledger(){return this.entries.map(e=>({...e}));}
 paymentHistory(){return [...this.payments.values()].map(p=>({...p}));}
 cashFlow(from?:string,to?:string){return this.entries.filter(e=>(!from||e.occurred_at>=from)&&(!to||e.occurred_at<=to)).reduce((total,e)=>total+(e.direction==='income'?e.amount:-e.amount),0);}
 periodSummary(from?:string,to?:string){const rows=this.entries.filter(e=>(!from||e.occurred_at>=from)&&(!to||e.occurred_at<=to));const revenue=rows.filter(e=>e.direction==='income').reduce((s,e)=>s+e.amount,0);const expense=rows.filter(e=>e.direction==='expense').reduce((s,e)=>s+e.amount,0);return{revenue,expense,net:revenue-expense,count:rows.length};}
 dailyTotals(){const days=new Map<string,{revenue:number;expense:number;net:number}>();for(const e of this.entries){const day=e.occurred_at.slice(0,10);const row=days.get(day)??{revenue:0,expense:0,net:0};if(e.direction==='income')row.revenue+=e.amount;else row.expense+=e.amount;row.net=row.revenue-row.expense;days.set(day,row);}return [...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,v])=>({date,...v}));}
 reconciliation():ReconciliationRow[]{return this.entries.map(entry=>{const related=[...this.payments.values()].filter(p=>p.business_event_id===entry.business_event_id&&p.status==='confirmed');const confirmed_amount=related.reduce((s,p)=>s+p.amount,0);const difference=entry.amount-confirmed_amount;return{business_event_id:entry.business_event_id,expected_amount:entry.amount,confirmed_amount,difference,payment_ids:related.map(p=>p.payment_id),status:confirmed_amount===entry.amount?'matched':confirmed_amount===0?'unmatched':confirmed_amount<entry.amount?'partial':'overpaid'};});}
 invariants(){const duplicateEntryKeys=new Set<string>();let unique=true;for(const e of this.entries){if(duplicateEntryKeys.has(e.idempotency_key))unique=false;duplicateEntryKeys.add(e.idempotency_key);}const finite=this.entries.every(e=>Number.isFinite(e.amount)&&e.amount>0)&&[...this.payments.values()].every(p=>Number.isFinite(p.amount)&&p.amount>0);return{unique_event_idempotency:unique,positive_finite_amounts:finite,ok:unique&&finite};}
}
