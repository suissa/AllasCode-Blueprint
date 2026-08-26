import type { ProjectionReader } from './application-api.js';
import type { CommerceState } from '../runtime/types.js';

function paginate<T>(items:T[],page:number,pageSize:number){const start=(page-1)*pageSize;return {items:items.slice(start,start+pageSize),page,page_size:pageSize,total:items.length};}
function matches(value:unknown,filters:Record<string,unknown>):boolean{
  if(!value||typeof value!=='object')return Object.keys(filters).length===0;
  const record=value as Record<string,unknown>;
  return Object.entries(filters).every(([key,expected])=>expected===undefined||String(record[key]??'').toLowerCase().includes(String(expected).toLowerCase()));
}

export class CommerceProjectionReader implements ProjectionReader{
  constructor(private readonly state:CommerceState){}
  async read(input:{projection:string;filters:Record<string,unknown>;page:number;page_size:number;principal_id:string}):Promise<unknown>{
    switch(input.projection){
      case'inventory':return paginate([...this.state.inventory.entries()].map(([product_id,quantity])=>({product_id,quantity})).filter(item=>matches(item,input.filters)),input.page,input.page_size);
      case'sales':return paginate([...this.state.sales.values()].filter(item=>matches(item,input.filters)),input.page,input.page_size);
      case'purchases':return paginate([...this.state.purchases.values()].filter(item=>matches(item,input.filters)),input.page,input.page_size);
      case'financial':return paginate([...this.state.ledger.values()].filter(item=>matches(item,input.filters)),input.page,input.page_size);
      case'invoices':return paginate([...this.state.invoices.values()].filter(item=>matches(item,input.filters)),input.page,input.page_size);
      default:throw new Error(`Unknown projection ${input.projection}`);
    }
  }
}
