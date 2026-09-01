import { randomBytes } from 'node:crypto';

export type ReportResult<T,E extends string=string>={outcome:'Ok';value:T}|{outcome:'Error';error:E};
export type ReportWidgetKind='metric'|'line'|'area'|'bar'|'stacked-bar'|'pie'|'donut'|'scatter'|'bubble'|'radar'|'gauge'|'funnel'|'heatmap'|'candlestick'|'treemap'|'sunburst'|'sankey'|'graph'|'parallel'|'boxplot'|'bar3d'|'scatter3d'|'line3d'|'surface3d'|'globe';

export interface ReportWidget{widget_id:string;kind:ReportWidgetKind;title:string;order:number;projection:string;data:unknown;animation?:'fade'|'rise'|'scale'|'orbit'}
export interface ReportDocument{report_id:string;owner_context_id:string;title:string;correlation_id:string;generated_at:string;widgets:ReportWidget[]}
export interface ReportShare{token:string;report_id:string;owner_context_id:string;created_at:string;expires_at:string;revoked_at?:string}
export interface WhatsAppReportPackage{caption:string;preview_image_url:string;share_url:string;mime_type:'image/png'}
export interface ReportPreviewRendererPort{renderPng(report:ReportDocument,shareUrl:string):Promise<ReportResult<{image_url:string},'PreviewRenderFailed'>>}

export class ConversationalReportSession{
 private revealed=new Set<string>();
 constructor(readonly report:ReportDocument){}
 revealNext(count=1):ReportResult<ReportWidget[],'InvalidRevealCount'> {
  if(count<1)return{outcome:'Error',error:'InvalidRevealCount'};
  const next=this.report.widgets.slice().sort((a,b)=>a.order-b.order).filter(w=>!this.revealed.has(w.widget_id)).slice(0,count);
  for(const widget of next)this.revealed.add(widget.widget_id);
  return{outcome:'Ok',value:next};
 }
 visible():ReportWidget[]{return this.report.widgets.slice().sort((a,b)=>a.order-b.order).filter(w=>this.revealed.has(w.widget_id));}
 reset():ReportResult<true>{this.revealed.clear();return{outcome:'Ok',value:true};}
}

export class ReportShareService{
 private readonly shares=new Map<string,ReportShare>();
 constructor(private readonly publicBaseUrl:string,private readonly now:()=>Date=()=>new Date()){}
 create(report:ReportDocument,ttlMs=1000*60*60*24):ReportResult<{share:ReportShare;url:string},'InvalidTtl'> {
  if(ttlMs<=0)return{outcome:'Error',error:'InvalidTtl'};
  const token=randomBytes(24).toString('base64url');
  const created=this.now();
  const share:ReportShare={token,report_id:report.report_id,owner_context_id:report.owner_context_id,created_at:created.toISOString(),expires_at:new Date(created.getTime()+ttlMs).toISOString()};
  this.shares.set(token,share);
  return{outcome:'Ok',value:{share,url:`${this.publicBaseUrl.replace(/\/$/,'')}/reports/share/${token}`}};
 }
 resolve(token:string):ReportResult<ReportShare,'NotFound'|'Expired'|'Revoked'> {
  const share=this.shares.get(token);if(!share)return{outcome:'Error',error:'NotFound'};
  if(share.revoked_at)return{outcome:'Error',error:'Revoked'};
  if(new Date(share.expires_at).getTime()<=this.now().getTime())return{outcome:'Error',error:'Expired'};
  return{outcome:'Ok',value:{...share}};
 }
 revoke(token:string,ownerContextId:string):ReportResult<true,'NotFound'|'Forbidden'> {
  const share=this.shares.get(token);if(!share)return{outcome:'Error',error:'NotFound'};
  if(share.owner_context_id!==ownerContextId)return{outcome:'Error',error:'Forbidden'};
  share.revoked_at=this.now().toISOString();return{outcome:'Ok',value:true};
 }
 async whatsApp(report:ReportDocument,preview:ReportPreviewRendererPort,ttlMs?:number):Promise<ReportResult<WhatsAppReportPackage,'InvalidTtl'|'PreviewRenderFailed'>>{
  const created=this.create(report,ttlMs);if(created.outcome==='Error')return created;
  const image=await preview.renderPng(report,created.value.url);if(image.outcome==='Error')return image;
  return{outcome:'Ok',value:{caption:`${report.title}\nVeja o relatório interativo: ${created.value.url}`,preview_image_url:image.value.image_url,share_url:created.value.url,mime_type:'image/png'}};
 }
}

export function assertProjectionBacked(report:ReportDocument):ReportResult<true,'MissingProjection'> {
 for(const widget of report.widgets)if(!widget.projection?.trim())return{outcome:'Error',error:'MissingProjection'};
 return{outcome:'Ok',value:true};
}
