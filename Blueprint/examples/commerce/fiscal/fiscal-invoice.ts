export type FiscalSource='purchase'|'sale';
export type FiscalStatus='pending'|'authorized'|'rejected'|'timeout'|'cancelled';
export type FiscalDocument={document_id:string;source_type:FiscalSource;source_id:string;amount:number;currency:'BRL';jurisdiction:string;status:FiscalStatus;external_id?:string;provider?:string;correlation_id:string;idempotency_key:string;updated_at:string};
export interface FiscalProviderTool{issue(input:{document_id:string;source_type:FiscalSource;source_id:string;amount:number;currency:'BRL';jurisdiction:string;idempotency_key:string}):Promise<{outcome:'Ok';external_id:string;status:'authorized';provider:string}|{outcome:'Error';code:'timeout'|'rejected';provider?:string}>;}
export interface FiscalEligibilityPolicy{canIssue(input:{source_type:FiscalSource;source_id:string;jurisdiction:string}):boolean;}
export class FiscalInvoiceService{
 private docs=new Map<string,FiscalDocument>(); private keys=new Map<string,string>();
 constructor(private readonly provider:FiscalProviderTool,private readonly policy:FiscalEligibilityPolicy){}
 async issue(input:{document_id:string;source_type:FiscalSource;source_id:string;amount:number;currency:'BRL';jurisdiction:string;correlation_id:string;idempotency_key:string;now:string}){
  const existingId=this.keys.get(input.idempotency_key); if(existingId)return{outcome:'Ok' as const,document:{...this.docs.get(existingId)!},duplicate:true as const};
  if(!Number.isFinite(input.amount)||input.amount<=0)return{outcome:'Error' as const,code:'InvalidAmount' as const};
  if(!this.policy.canIssue(input))return{outcome:'Error' as const,code:'NotEligible' as const};
  const base:FiscalDocument={...input,status:'pending'}; this.docs.set(input.document_id,base); this.keys.set(input.idempotency_key,input.document_id);
  const result=await this.provider.issue(input);
  if(result.outcome==='Ok'){const doc:FiscalDocument={...base,status:'authorized',external_id:result.external_id,provider:result.provider};this.docs.set(input.document_id,doc);return{outcome:'Ok' as const,document:{...doc}};}
  const doc:FiscalDocument={...base,status:result.code, ...(result.provider?{provider:result.provider}:{})};this.docs.set(input.document_id,doc);return{outcome:'Error' as const,code:result.code,healing_required:true as const,document:{...doc}};
 }
 get(id:string){const d=this.docs.get(id);return d?{...d}:undefined;}
 list(){return[...this.docs.values()].map(d=>({...d}));}
}
