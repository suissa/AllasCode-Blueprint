import {SemanticUiClient} from './api-client.js';

export type SearchEntity='products'|'purchases'|'sales'|'customers'|'suppliers';
export type ExportFormat='csv'|'json';
export type SearchFilters={query?:string;from?:string;to?:string;status?:string;min_value?:number;max_value?:number};
export type SearchRequest={entity:SearchEntity;filters:SearchFilters;page?:number;page_size?:number};
export type ExportRequest={entity:SearchEntity;filters:SearchFilters;format:ExportFormat;fields?:string[]};

const projectionByEntity:Record<SearchEntity,string>={products:'ProductsInventoryProjection',purchases:'PurchasesProjection',sales:'SalesProjection',customers:'CustomersProjection',suppliers:'SuppliersProjection'};

export class SearchExportUi{
  constructor(private readonly api:SemanticUiClient){}
  search(request:SearchRequest,correlationId:string){
    const page=Math.max(1,request.page??1);
    const pageSize=Math.min(100,Math.max(1,request.page_size??25));
    return this.api.query(projectionByEntity[request.entity],request.filters,correlationId,page,pageSize);
  }
  exportData(request:ExportRequest,correlationId:string,idempotencyKey:string){
    return this.api.command('RequestManagementExportIntent',{...request,authorization_scope:'current-operator',mask_protected_fields:true,delivery:'stream'},correlationId,idempotencyKey);
  }
}

// Search projections enforce visibility; export generation, masking and authorization are server-owned.
// The UI never fetches all rows to build CSV/JSON locally and caps interactive pages to 100 records.