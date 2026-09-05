export type PaymentMethod='credit'|'debit'|'pix'|'cash'|'other';
export type ExternalTransactionStatus='approved'|'pending'|'cancelled'|'refunded'|'failed';

export type ExternalSaleTransaction={
  provider:string;
  transaction_id:string;
  amount:number;
  currency:string;
  occurred_at:string;
  payment_method:PaymentMethod;
  status:ExternalTransactionStatus;
  customer_hint?:{phone?:string;document?:string};
  products?:Array<{product_id?:string;label:string;quantity:number;unit_price?:number}>;
  raw?:unknown;
};

export interface SaleMachineProviderTool{
  readonly provider:string;
  discover(cursor?:string):Promise<{transactions:ExternalSaleTransaction[];cursor?:string}>;
  normalizeWebhook(payload:unknown):Promise<ExternalSaleTransaction[]>;
}

export interface ExternalTransactionStore{
  has(key:string):Promise<boolean>;
  mark(key:string,transaction:ExternalSaleTransaction):Promise<void>;
}

export interface SemanticCommandPort{
  command(intent:string,payload:Record<string,unknown>,correlationId:string,idempotencyKey:string):Promise<unknown>;
}

export interface SaleResolutionFollowUpPort{
  request(input:{transaction:ExternalSaleTransaction;correlation_id:string}):Promise<void>;
}

export class InMemoryExternalTransactionStore implements ExternalTransactionStore{
  private readonly seen=new Map<string,ExternalSaleTransaction>();
  async has(key:string){return this.seen.has(key);}
  async mark(key:string,transaction:ExternalSaleTransaction){this.seen.set(key,structuredClone(transaction));}
}

export class PaymentSaleMachineIngress{
  constructor(
    private readonly provider:SaleMachineProviderTool,
    private readonly store:ExternalTransactionStore,
    private readonly semantic:SemanticCommandPort,
    private readonly followUp:SaleResolutionFollowUpPort,
  ){}

  async poll(cursor?:string){
    const discovered=await this.provider.discover(cursor);
    for(const transaction of discovered.transactions)await this.accept(transaction);
    return discovered.cursor;
  }

  async webhook(payload:unknown){
    const transactions=await this.provider.normalizeWebhook(payload);
    for(const transaction of transactions)await this.accept(transaction);
  }

  private async accept(transaction:ExternalSaleTransaction){
    const key=`${transaction.provider}:${transaction.transaction_id}`;
    if(await this.store.has(key))return;

    const correlationId=`payment:${transaction.provider}:${transaction.transaction_id}`;
    const preserved={
      provider:transaction.provider,
      external_transaction_id:transaction.transaction_id,
      amount:transaction.amount,
      currency:transaction.currency,
      occurred_at:transaction.occurred_at,
      payment_method:transaction.payment_method,
      payment_status:transaction.status,
      products:transaction.products,
      customer_hint:transaction.customer_hint,
    };

    if(transaction.status==='cancelled'||transaction.status==='refunded'){
      await this.semantic.command('ReconcileExternalSaleStatusIntent',preserved,correlationId,key);
      await this.store.mark(key,transaction);
      return;
    }

    if(transaction.status!=='approved'){
      await this.semantic.command('ObserveExternalPaymentIntent',preserved,correlationId,key);
      await this.store.mark(key,transaction);
      return;
    }

    await this.semantic.command('ProcessSaleIntent',preserved,correlationId,key);

    if(!transaction.products?.length){
      await this.followUp.request({transaction,correlation_id:correlationId});
    }

    await this.store.mark(key,transaction);
  }
}

// This layer only transports and preserves provider facts. It cannot mutate stock,
// infer products, decide refund/cancel rules or bypass the semantic runtime.