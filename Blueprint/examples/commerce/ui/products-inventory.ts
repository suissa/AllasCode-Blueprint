import {SemanticUiClient,type SemanticEnvelope} from './api-client.js';
import {Card,Field,FilterBar,StateView,Status,Table} from './design-system.js';

export type ProductListFilters={search?:string;status?:'all'|'ok'|'low'|'out';category?:string};
export type ProductRow={product_id:string;name:string;sku?:string;category?:string;unit?:string;current_stock:number;minimum_stock:number;stock_status:'ok'|'low'|'out';active:boolean};
export type StockMovement={movement_id:string;product_id:string;at:string;kind:'purchase'|'sale'|'adjustment';quantity:number;reason?:string;reference_id?:string};
export type ProductDraft={product_id?:string;name:string;sku?:string;category?:string;unit?:string;minimum_stock?:number;active?:boolean};
export type StockAdjustmentDraft={product_id:string;quantity:number;reason:string};

function esc(v:unknown){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
function stockStatus(value:ProductRow['stock_status']){return Status({label:value==='ok'?'Normal':value==='low'?'Estoque baixo':'Sem estoque',tone:value==='ok'?'success':value==='low'?'warning':'danger'});}

export class ProductsInventoryUi{
  constructor(private readonly api:SemanticUiClient){}

  list(filters:ProductListFilters,correlationId:string,page=1,pageSize=25){
    return this.api.query('ProductsInventoryProjection',filters,correlationId,page,pageSize);
  }
  movements(productId:string,correlationId:string,page=1,pageSize=50){
    return this.api.query('InventoryMovementsProjection',{product_id:productId},correlationId,page,pageSize);
  }
  saveProduct(mode:'create'|'edit',draft:ProductDraft,correlationId:string,idempotencyKey:string){
    return this.api.command(mode==='create'?'CreateProductIntent':'UpdateProductMetadataIntent',draft,correlationId,idempotencyKey);
  }
  adjustStock(draft:StockAdjustmentDraft,correlationId:string,idempotencyKey:string){
    return this.api.command('AdjustStockIntent',draft,correlationId,idempotencyKey);
  }

  renderList(state:{kind:'loading'}|{kind:'empty'}|{kind:'error';message:string}|{kind:'ready';items:ProductRow[];total:number;filters?:ProductListFilters}){
    if(state.kind==='loading')return StateView('loading');
    if(state.kind==='empty')return StateView('empty','Nenhum produto encontrado.');
    if(state.kind==='error')return StateView('error',state.message);
    const f=state.filters??{};
    const filters=FilterBar({fields:[Field({id:'products-search',label:'Buscar',value:f.search??'',placeholder:'Nome, SKU ou código'}),Field({id:'products-category',label:'Categoria',value:f.category??''})],submitLabel:'Filtrar'});
    const rows=state.items.map(p=>[p.name,p.sku??'—',p.category??'—',p.current_stock,p.minimum_stock,stockStatus(p.stock_status),Status({label:p.active?'Ativo':'Inativo',tone:p.active?'success':'neutral'})]);
    return `<section class="products-inventory" aria-labelledby="products-title"><header><div><h1 id="products-title">Produtos e estoque</h1><p>${state.total} produto(s)</p></div><button type="button" data-action="create-product">Novo produto</button></header>${filters}${Table({caption:'Produtos e estoque atual',headers:['Produto','SKU','Categoria','Atual','Mínimo','Estoque','Status'],rows})}</section>`;
  }

  renderEditor(input:{mode:'create'|'edit';draft:ProductDraft;result?:SemanticEnvelope}){
    const error=input.result?.outcome==='Error'?`<div role="alert" class="field-error"><strong>Não foi possível salvar.</strong> ${esc(input.result.error?.message??'Validação semântica pendente.')}</div>`:'';
    const d=input.draft;
    return `<form class="product-editor" data-preserve-input="true" aria-label="${input.mode==='create'?'Criar':'Editar'} produto">${error}${Field({id:'product-name',label:'Nome',value:d.name,required:true})}${Field({id:'product-sku',label:'SKU',value:d.sku??''})}${Field({id:'product-category',label:'Categoria',value:d.category??''})}${Field({id:'product-unit',label:'Unidade',value:d.unit??''})}${Field({id:'product-minimum-stock',label:'Estoque mínimo',type:'number',value:d.minimum_stock??0})}<label><input type="checkbox" name="active" ${d.active===false?'':'checked'}> Produto ativo</label><button type="submit">Salvar</button></form>`;
  }

  renderMovements(state:{kind:'loading'}|{kind:'empty'}|{kind:'error';message:string}|{kind:'ready';product:ProductRow;items:StockMovement[]}){
    if(state.kind==='loading')return StateView('loading');
    if(state.kind==='empty')return StateView('empty','Nenhuma movimentação registrada.');
    if(state.kind==='error')return StateView('error',state.message);
    return Card({title:`Movimentações — ${state.product.name}`,body:Table({caption:`Histórico de estoque de ${state.product.name}`,headers:['Data','Tipo','Quantidade','Motivo/Referência'],rows:state.items.map(m=>[m.at,m.kind,m.quantity,m.reason??m.reference_id??'—'])})});
  }

  renderAdjustment(input:{draft:StockAdjustmentDraft;result?:SemanticEnvelope}){
    const error=input.result?.outcome==='Error'?`<div role="alert">${esc(input.result.error?.message??'Ajuste requer correção ou healing.')}</div>`:'';
    return `<form class="stock-adjustment" data-preserve-input="true" aria-label="Ajuste manual de estoque">${error}<input type="hidden" name="product_id" value="${esc(input.draft.product_id)}">${Field({id:'adjustment-quantity',label:'Variação de quantidade',type:'number',value:input.draft.quantity,required:true})}${Field({id:'adjustment-reason',label:'Motivo do ajuste',value:input.draft.reason,required:true})}<p>O ajuste será enviado para autorização e validação semântica.</p><button type="submit">Solicitar ajuste</button></form>`;
  }
}

// The UI displays stock_status/current_stock/minimum_stock exactly as projected by the backend.
// It does not calculate stock authority or apply adjustments locally; mutations are explicit Intents.
