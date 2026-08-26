import {SemanticUiClient,type SemanticEnvelope} from './api-client.js';
import {Card,Field,Filters,StateView,Status,Table} from './design-system.js';

export type SaleRow={sale_id:string;at:string;customer_id?:string;customer_name?:string;total:number;currency:string;payment_state:'pending'|'paid'|'refunded'|'failed';status:'identified'|'needs-products'|'completed'|'cancelled'|'refunded';products:Array<{product_id:string;name:string;quantity:number;unit_price:number}>;stock_effects:Array<{product_id:string;quantity_delta:number}>;allowed_actions:Array<'associate-customer'|'resolve-products'|'cancel'|'refund'>};
export type CustomerRow={customer_id:string;name:string;phone?:string;document?:string;active:boolean;purchase_count:number;total_spent:number;last_purchase_at?:string};
export type CustomerDraft={customer_id?:string;name:string;phone?:string;document?:string;active?:boolean};
export type SaleResolutionDraft={sale_id:string;products:Array<{product_id:string;name:string;quantity:number;unit_price:number}>};

function esc(v:unknown){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
function saleStatus(s:SaleRow['status']){return Status({label:s==='needs-products'?'Identificar produtos':s==='completed'?'Concluída':s==='cancelled'?'Cancelada':s==='refunded'?'Estornada':'Identificada',tone:s==='completed'?'success':s==='needs-products'?'warning':s==='cancelled'||s==='refunded'?'danger':'neutral'});}

export class SalesCustomersUi{
 constructor(private readonly api:SemanticUiClient){}
 sales(filters:Record<string,unknown>,correlationId:string,page=1,pageSize=25){return this.api.query('SalesProjection',filters,correlationId,page,pageSize);}
 saleDetails(saleId:string,correlationId:string){return this.api.query('SaleDetailsProjection',{sale_id:saleId},correlationId,1,1);}
 customers(filters:Record<string,unknown>,correlationId:string,page=1,pageSize=25){return this.api.query('CustomersProjection',filters,correlationId,page,pageSize);}
 customerHistory(customerId:string,correlationId:string,page=1,pageSize=25){return this.api.query('CustomerPurchaseHistoryProjection',{customer_id:customerId},correlationId,page,pageSize);}
 resolveSale(draft:SaleResolutionDraft,correlationId:string,idempotencyKey:string){return this.api.command('ProcessSaleIntent',draft,correlationId,idempotencyKey);}
 associateCustomer(input:{sale_id:string;customer_id:string},correlationId:string,idempotencyKey:string){return this.api.command('AssociateCustomerToSaleIntent',input,correlationId,idempotencyKey);}
 saveCustomer(mode:'create'|'edit',draft:CustomerDraft,correlationId:string,idempotencyKey:string){return this.api.command(mode==='create'?'CreateCustomerIntent':'UpdateCustomerIntent',draft,correlationId,idempotencyKey);}
 cancelSale(sale:SaleRow,reason:string,correlationId:string,idempotencyKey:string){if(!sale.allowed_actions.includes('cancel'))throw new Error('Sale cancellation is not permitted by projection.');return this.api.command('CancelSaleIntent',{sale_id:sale.sale_id,reason},correlationId,idempotencyKey);}
 refundSale(sale:SaleRow,reason:string,correlationId:string,idempotencyKey:string){if(!sale.allowed_actions.includes('refund'))throw new Error('Sale refund is not permitted by projection.');return this.api.command('RefundSaleIntent',{sale_id:sale.sale_id,reason},correlationId,idempotencyKey);}

 renderSales(state:{kind:'loading'}|{kind:'empty'}|{kind:'error';message:string}|{kind:'ready';items:SaleRow[]}){
  if(state.kind==='loading')return StateView('loading');if(state.kind==='empty')return StateView('empty','Nenhuma venda encontrada.');if(state.kind==='error')return StateView('error',state.message);
  const filters=Filters({label:'Filtros de vendas',content:Field({id:'sale-search',label:'Buscar venda ou cliente'})});
  return `<section aria-labelledby="sales-title"><header><h1 id="sales-title">Vendas</h1></header>${filters}${Table({caption:'Vendas',headers:['Data','Venda','Cliente','Total','Pagamento','Status'],rows:state.items.map(s=>[s.at,s.sale_id,s.customer_name??'—',`${s.currency} ${s.total}`,s.payment_state,saleStatus(s.status)])})}</section>`;
 }
 renderSaleDetails(sale:SaleRow){
  const productRows=sale.products.map(p=>[p.name,p.quantity,p.unit_price]);const stockRows=sale.stock_effects.map(e=>[e.product_id,e.quantity_delta]);
  const actionHint=sale.allowed_actions.length?`<p>Ações permitidas: ${sale.allowed_actions.map(esc).join(', ')}</p>`:'<p>Nenhuma ação adicional permitida.</p>';
  return Card({title:`Venda ${sale.sale_id}`,body:`<p>Pagamento: ${esc(sale.payment_state)}</p>${Table({caption:'Produtos da venda',headers:['Produto','Quantidade','Preço unitário'],rows:productRows})}${Table({caption:'Efeitos de estoque projetados',headers:['Produto','Variação'],rows:stockRows})}${actionHint}`});
 }
 renderResolution(input:{draft:SaleResolutionDraft;result?:SemanticEnvelope}){
  const error=input.result?.outcome==='Error'?`<div role="alert">${esc(input.result.error?.message??'A venda ainda precisa de identificação ou healing.')}</div>`:'';
  return `<form data-preserve-input="true" aria-label="Resolver produtos da venda">${error}<input type="hidden" name="sale_id" value="${esc(input.draft.sale_id)}"><p>${input.draft.products.length} produto(s) identificado(s). A mutação será validada pelo domínio.</p><button type="submit">Confirmar produtos</button></form>`;
 }
 renderCustomers(state:{kind:'loading'}|{kind:'empty'}|{kind:'error';message:string}|{kind:'ready';items:CustomerRow[]}){
  if(state.kind==='loading')return StateView('loading');if(state.kind==='empty')return StateView('empty','Nenhum cliente encontrado.');if(state.kind==='error')return StateView('error',state.message);
  return `<section aria-labelledby="customers-title"><header><h1 id="customers-title">Clientes</h1><button data-action="new-customer">Novo cliente</button></header>${Table({caption:'Clientes',headers:['Nome','Telefone','Documento','Compras','Total comprado','Última compra','Status'],rows:state.items.map(c=>[c.name,c.phone??'—',c.document??'—',c.purchase_count,c.total_spent,c.last_purchase_at??'—',Status({label:c.active?'Ativo':'Inativo',tone:c.active?'success':'neutral'})])})}</section>`;
 }
}

// Sale totals, payment state, stock effects and allowed actions are backend projections. The browser never derives refund/cancellation authority or applies stock effects locally.