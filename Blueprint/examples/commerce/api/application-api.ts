export type ApiPrincipal={id:string;permissions:string[]};
export type CommandRequest={intent:string;payload:unknown;correlation_id:string;idempotency_key:string;principal:ApiPrincipal};
export type QueryRequest={projection:string;filters?:Record<string,unknown>;page?:number;page_size?:number;principal:ApiPrincipal;correlation_id:string};
export type ApiEnvelope<T=unknown>={version:'v1';correlation_id:string;outcome:'Ok'|'Error';data?:T;error?:{code:string;message:string}};

export interface IntentRuntime{execute(input:{intent:string;payload:unknown;correlation_id:string;idempotency_key:string;principal_id:string}):Promise<{outcome:'Ok'|'Error';data?:unknown;error?:{code:string;message:string}}>}
export interface ProjectionReader{read(input:{projection:string;filters:Record<string,unknown>;page:number;page_size:number;principal_id:string}):Promise<unknown>}
export interface AccessPolicy{allows(principal:ApiPrincipal,operation:string,resource:string):boolean}

export class ApplicationApi{
  constructor(private runtime:IntentRuntime,private projections:ProjectionReader,private access:AccessPolicy,private maxPageSize=100){}
  async command(req:CommandRequest):Promise<ApiEnvelope>{
    if(!req.principal?.id)return this.error(req.correlation_id,'UNAUTHENTICATED','Authentication required');
    if(!req.correlation_id)return this.error('unknown','INVALID_CORRELATION','correlation_id is required');
    if(!req.idempotency_key)return this.error(req.correlation_id,'INVALID_IDEMPOTENCY','idempotency_key is required');
    if(!this.access.allows(req.principal,'execute',req.intent))return this.error(req.correlation_id,'FORBIDDEN','Intent is not allowed');
    try{
      const result=await this.runtime.execute({intent:req.intent,payload:req.payload,correlation_id:req.correlation_id,idempotency_key:req.idempotency_key,principal_id:req.principal.id});
      return result.outcome==='Ok'?{version:'v1',correlation_id:req.correlation_id,outcome:'Ok',data:result.data}:this.error(req.correlation_id,result.error?.code??'SEMANTIC_ERROR',result.error?.message??'Intent ended with Error');
    }catch{return this.error(req.correlation_id,'BOUNDARY_ERROR','Request could not be completed');}
  }
  async query(req:QueryRequest):Promise<ApiEnvelope>{
    if(!req.principal?.id)return this.error(req.correlation_id,'UNAUTHENTICATED','Authentication required');
    if(!this.access.allows(req.principal,'read',req.projection))return this.error(req.correlation_id,'FORBIDDEN','Projection is not allowed');
    const page=Math.max(1,req.page??1),page_size=Math.min(this.maxPageSize,Math.max(1,req.page_size??25));
    try{return {version:'v1',correlation_id:req.correlation_id,outcome:'Ok',data:await this.projections.read({projection:req.projection,filters:req.filters??{},page,page_size,principal_id:req.principal.id})};}
    catch{return this.error(req.correlation_id,'BOUNDARY_ERROR','Query could not be completed');}
  }
  private error(correlation_id:string,code:string,message:string):ApiEnvelope{return {version:'v1',correlation_id,outcome:'Error',error:{code,message}};}
}
