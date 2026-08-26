export type UiPrincipal={id:string;permissions:string[]};
export type SemanticEnvelope<T=unknown>={version:'v1';correlation_id:string;outcome:'Ok'|'Error';data?:T;error?:{code:string;message:string}};
export interface UiTransport{request(input:{method:'GET'|'POST';path:string;headers:Record<string,string>;body?:unknown}):Promise<SemanticEnvelope>;}

export class SemanticUiClient{
  constructor(private readonly transport:UiTransport,private readonly principal:UiPrincipal){}
  command(intent:string,payload:unknown,correlationId:string,idempotencyKey:string){
    return this.transport.request({method:'POST',path:`/v1/intents/${encodeURIComponent(intent)}`,headers:{'x-correlation-id':correlationId,'idempotency-key':idempotencyKey,'x-principal-id':this.principal.id},body:payload});
  }
  query(projection:string,filters:Record<string,unknown>,correlationId:string,page=1,pageSize=25){
    const params=new URLSearchParams({projection,page:String(page),page_size:String(pageSize),filters:JSON.stringify(filters)});
    return this.transport.request({method:'GET',path:`/v1/projections?${params}`,headers:{'x-correlation-id':correlationId,'x-principal-id':this.principal.id}});
  }
}

// The browser can address only explicit Intents and Projections. Business rules,
// Action ownership, Agent routing and healing remain behind ApplicationApi.
