import {EvolutionGoProvider} from '../evolution-go/provider.js';
import type {SaleResolutionFollowUpPort} from './index.js';

export class EvolutionGoSaleResolutionFollowUp implements SaleResolutionFollowUpPort{
  constructor(private readonly whatsapp:EvolutionGoProvider,private readonly operatorNumber:string){}

  async request({transaction,correlation_id}:Parameters<SaleResolutionFollowUpPort['request']>[0]){
    const amount=new Intl.NumberFormat('pt-BR',{style:'currency',currency:transaction.currency||'BRL'}).format(transaction.amount);
    const text=`Identifiquei a venda ${transaction.transaction_id} de ${amount}. Quais produtos e quantidades foram vendidos? Ref: ${correlation_id}`;
    await this.whatsapp.sendText(this.operatorNumber,text);
  }
}

// Evolution Go is only the outbound transport. Sale composition is resolved by the conversation/semantic runtime.