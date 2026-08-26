import {SemanticUiClient,type SemanticEnvelope} from './api-client.js';
import {Card,Field,Filters,StateView,Status,Table} from './design-system.js';

export type PurchaseRow={purchase_id:string;supplier_id:string;supplier_name:string;at:string;total:number;currency:string;status:'resolved'|'pending-confirmation'|'completed';evidence_count:number};
export type SupplierRow={supplier_id:string;name:string;document?:string;phone?:string;active:boolean;purchase_count:number;last_purchase_at?:string};
export type PurchaseEvidence={evidence_id:string;kind:'image'|'audio'|'text'|'payment';source:string;resolved_values:Record<string,unknown>;status:'resolved'|'needs-confirmation'};
export type PurchaseDraft={purchase_id?:string;supplier_id:string;supplier_name:string;currency:'BRL';items:Array<{product_id:string;name:string;quantity:number;unit_price:number}>};
export type SupplierDraft={supplier_id?:string;name:string;document?:string;phone?:string;active?:boolean};

function esc(v:unknown){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
function purchaseStatus(status:PurchaseRow['status']){return Status({label:status==='completed'?'Concluída':status==='resolved'?'Resolvida':'Confirmação humana',tone:status==='completed'?'success':status==='resolved'?'neutral':'warning'});}

export class PurchasesSuppliersUi{
 constructor(private readonly api:SemanticUiClient){}
 purchases(filters:Record<string,unknown>,correlationId:string,page=1,pageSize=25){return this.api.query('PurchasesProjection',filters,correlationId,page,pageSize);}
 suppliers(filters:Record<string,unknown>,correlationId:string,page=1,pageSize=25){return this.api.query('SuppliersProjection',filters,correlationId,page,pageSize);}
 supplierHistory(supplierId:string,correlationId:string,page=1,pageSize=25){return this.api.query('SupplierPurchaseHistoryProjection',{supplier_id:supplierId},correlationId,page,pageSize);}
 evidence(purchaseId:string,correlationId:string){return this.api.query('PurchaseEvidenceProjection',{purchase_id:purchaseId},correlationId,1,100);}
 savePurchase(draft:PurchaseDraft,correlationId:string,idempotencyKey:string){return this.api.command('PurchaseProductsIntent',draft,correlationId,idempotencyKey);}
 saveSupplier(mode:'create'|'edit',draft:SupplierDraft,correlationId:string,idempotencyKey:string){return this.api.command(mode==='create'?'CreateSupplierIntent':'UpdateSupplierIntent',draft,correlationId,idempotencyKey);}
 confirmEvidence(input:{purchase_id:string;evidence_id:string;resolved_values:Record<string,unknown>},correlationId:string,idempotencyKey:string){return this.api.command('ConfirmPurchaseEvidenceIntent',input,correlationId,idempotencyKey);}

 renderPurchases(state:{kind:'loading'}|{kind:'empty'}|{kind:'error';message:string}|{kind:'ready';items:PurchaseRow[]}){
  if(state.kind==='loading')return StateView('loading');if(state.kind==='empty')return StateView('empty','Nenhuma compra encontrada.');if(state.kind==='error')return StateView('error',state.message);
  const filters=Filters({label:'Filtros de compras',content:Field({id:'purchase-search',label:'Buscar compra ou fornecedor'})});
  return `<section aria-labelledby="purchases-title"><header><h1 id="purchases-title">Compras</h1><button data-action="new-purchase">Registrar compra</button></header>${filters}${Table({caption:'Histórico de compras',headers:['Data','Compra','Fornecedor','Total','Status','Evidências'],rows:state.items.map(p=>[p.at,p.purchase_id,p.supplier_name,`${p.currency} ${p.total}`,purchaseStatus(p.status),p.evidence_count])})}</section>`;
 }
 renderEvidence(input:{purchase:PurchaseRow;items:PurchaseEvidence[]}){
  const unresolved=input.items.filter(e=>e.status==='needs-confirmation');
  const warning=unresolved.length?`<div role="alert">${unresolved.length} evidência(s) precisam de confirmação humana.</div>`:'';
  return Card({title:`Evidências — ${input.purchase.purchase_id}`,body:warning+Table({caption:'Evidências e valores resolvidos',headers:['Tipo','Origem','Estado','Valores resolvidos'],rows:input.items.map(e=>[e.kind,e.source,e.status==='resolved'?'Resolvida':'Confirmar',JSON.stringify(e.resolved_values)])})});
 }
 renderPurchaseEditor(input:{draft:PurchaseDraft;result?:SemanticEnvelope}){
  const error=input.result?.outcome==='Error'?`<div role="alert">${esc(input.result.error?.message??'A compra precisa de correção ou confirmação.')}</div>`:'';
  return `<form data-preserve-input="true" aria-label="Registrar compra">${error}${Field({id:'purchase-supplier-id',label:'Fornecedor',value:input.draft.supplier_id,required:true})}${Field({id:'purchase-supplier-name',label:'Nome do fornecedor',value:input.draft.supplier_name,required:true})}<p>${input.draft.items.length} item(ns) informado(s). Os valores serão validados pelo domínio.</p><button type="submit">Concluir compra</button></form>`;
 }
 renderSuppliers(state:{kind:'loading'}|{kind:'empty'}|{kind:'error';message:string}|{kind:'ready';items:SupplierRow[]}){
  if(state.kind==='loading')return StateView('loading');if(state.kind==='empty')return StateView('empty','Nenhum fornecedor encontrado.');if(state.kind==='error')return StateView('error',state.message);
  return `<section aria-labelledby="suppliers-title"><header><h1 id="suppliers-title">Fornecedores</h1><button data-action="new-supplier">Novo fornecedor</button></header>${Table({caption:'Fornecedores',headers:['Nome','Documento','Telefone','Compras','Última compra','Status'],rows:state.items.map(s=>[s.name,s.document??'—',s.phone??'—',s.purchase_count,s.last_purchase_at??'—',Status({label:s.active?'Ativo':'Inativo',tone:s.active?'success':'neutral'})])})}</section>`;
 }
}

// Evidence resolution and purchase completion are domain commands. The browser only presents projected evidence and preserves human corrections.