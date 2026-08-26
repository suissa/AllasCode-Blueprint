import type { ApplicationApi, ApiEnvelope, ApiPrincipal } from './application-api.js';

export type HttpRequest={method:string;path:string;headers:Record<string,string|undefined>;query?:Record<string,string|undefined>;body?:unknown;principal?:ApiPrincipal};
export type HttpResponse={status:number;headers:Record<string,string>;body:ApiEnvelope};

export class HttpApplicationAdapter{
  constructor(private readonly api:ApplicationApi){}

  async handle(req:HttpRequest):Promise<HttpResponse>{
    const correlation=req.headers['x-correlation-id']??'';
    const principal=req.principal??{id:'',permissions:[]};
    let envelope:ApiEnvelope;
    if(req.method==='POST'&&req.path.startsWith('/v1/intents/')){
      const intent=decodeURIComponent(req.path.slice('/v1/intents/'.length));
      envelope=await this.api.command({intent,payload:req.body,correlation_id:correlation,idempotency_key:req.headers['idempotency-key']??'',principal});
    }else if(req.method==='GET'&&req.path.startsWith('/v1/projections/')){
      const projection=decodeURIComponent(req.path.slice('/v1/projections/'.length));
      const filters=Object.fromEntries(Object.entries(req.query??{}).filter(([key,value])=>key!=='page'&&key!=='page_size'&&value!==undefined));
      envelope=await this.api.query({projection,filters,page:Number(req.query?.page??1),page_size:Number(req.query?.page_size??25),principal,correlation_id:correlation});
    }else{
      envelope={version:'v1',correlation_id:correlation||'unknown',outcome:'Error',error:{code:'NOT_FOUND',message:'Route not found'}};
    }
    return {status:this.status(envelope),headers:{'content-type':'application/json','x-correlation-id':envelope.correlation_id},body:envelope};
  }

  private status(envelope:ApiEnvelope):number{
    if(envelope.outcome==='Ok')return 200;
    switch(envelope.error?.code){case'UNAUTHENTICATED':return 401;case'FORBIDDEN':return 403;case'NOT_FOUND':return 404;case'INVALID_CORRELATION':case'INVALID_IDEMPOTENCY':return 400;default:return 422;}
  }
}
