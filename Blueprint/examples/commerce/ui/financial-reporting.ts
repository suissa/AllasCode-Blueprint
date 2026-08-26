import {SemanticUiClient} from './api-client.js';
import {Card,Field,Filters,StateView,Status,Table} from './design-system.js';

export type FinancialPeriod={from:string;to:string};
export type CashFlowProjection={period:FinancialPeriod;currency:string;revenue:number;expenses:number;balance:number;opening_balance:number;closing_balance:number;entries:Array<{at:string;kind:'revenue'|'expense';description:string;amount:number}>};
export type ReconciliationRow={payment_id:string;sale_id?:string;at:string;amount:number;currency:string;provider:string;status:'matched'|'pending'|'divergent';reason?:string};
export type ManagementReport={kind:'sales'|'purchases'|'margin'|'inventory-valuation';period:FinancialPeriod;currency:string;totals:Record<string,number>;rows:Array<Record<string,string|number>>};
export type ReportFilters={from:string;to:string;status?:string;provider?:string;query?:string};

function money(value:number,currency:string){return new Intl.NumberFormat('pt-BR',{style:'currency',currency}).format(value);}
function reconcileStatus(status:ReconciliationRow['status']){return Status({label:status==='matched'?'Conciliado':status==='pending'?'Pendente':'Divergente',tone:status==='matched'?'success':status==='pending'?'warning':'danger'});}

export class FinancialReportingUi{
 constructor(private readonly api:SemanticUiClient){}
 cashFlow(filters:ReportFilters,correlationId:string){return this.api.query('CashFlowProjection',filters,correlationId,1,1);}
 reconciliation(filters:ReportFilters,correlationId:string,page=1,pageSize=25){return this.api.query('PaymentReconciliationProjection',filters,correlationId,page,pageSize);}
 report(kind:ManagementReport['kind'],filters:ReportFilters,correlationId:string,page=1,pageSize=100){return this.api.query('ManagementReportProjection',{kind,...filters},correlationId,page,pageSize);}
 exportReport(kind:ManagementReport['kind'],format:'csv'|'xlsx'|'pdf',filters:ReportFilters,correlationId:string,idempotencyKey:string){return this.api.command('ExportManagementReportIntent',{kind,format,filters},correlationId,idempotencyKey);}

 renderCashFlow(state:{kind:'loading'}|{kind:'empty'}|{kind:'error';message:string}|{kind:'ready';data:CashFlowProjection}){
  if(state.kind==='loading')return StateView('loading');if(state.kind==='empty')return StateView('empty','Nenhum movimento financeiro no período.');if(state.kind==='error')return StateView('error',state.message);
  const d=state.data;
  return `<section aria-labelledby="financial-title"><h1 id="financial-title">Financeiro</h1>${this.filters(d.period)}<div class="financial-summary">${Card({title:'Receitas',body:money(d.revenue,d.currency)})}${Card({title:'Despesas',body:money(d.expenses,d.currency)})}${Card({title:'Saldo do período',body:money(d.balance,d.currency)})}${Card({title:'Saldo final',body:money(d.closing_balance,d.currency)})}</div>${Table({caption:'Fluxo de caixa',headers:['Data','Tipo','Descrição','Valor'],rows:d.entries.map(e=>[e.at,e.kind==='revenue'?'Receita':'Despesa',e.description,money(e.amount,d.currency)])})}</section>`;
 }
 renderReconciliation(state:{kind:'loading'}|{kind:'empty'}|{kind:'error';message:string}|{kind:'ready';items:ReconciliationRow[]}){
  if(state.kind==='loading')return StateView('loading');if(state.kind==='empty')return StateView('empty','Nenhum pagamento para conciliar.');if(state.kind==='error')return StateView('error',state.message);
  return `<section aria-labelledby="reconciliation-title"><h1 id="reconciliation-title">Conciliação</h1>${Table({caption:'Conciliação de pagamentos',headers:['Data','Pagamento','Venda','Provider','Valor','Estado','Motivo'],rows:state.items.map(r=>[r.at,r.payment_id,r.sale_id??'—',r.provider,money(r.amount,r.currency),reconcileStatus(r.status),r.reason??'—'])})}</section>`;
 }
 renderReport(input:{report:ManagementReport;headers:string[]}){
  const r=input.report;const totalCards=Object.entries(r.totals).map(([key,value])=>Card({title:key,body:money(value,r.currency)})).join('');
  const rows=r.rows.map(row=>input.headers.map(h=>row[h]??'—'));
  return `<section aria-labelledby="report-title"><header><div><h1 id="report-title">Relatório: ${r.kind}</h1><p>${r.period.from} — ${r.period.to}</p></div><div class="report-export" aria-label="Exportar relatório"><button data-format="csv">CSV</button><button data-format="xlsx">XLSX</button><button data-format="pdf">PDF</button></div></header>${this.filters(r.period)}<div class="report-totals">${totalCards}</div>${Table({caption:`Relatório ${r.kind}`,headers:input.headers,rows})}</section>`;
 }
 private filters(period:FinancialPeriod){return Filters({label:'Filtros financeiros',content:Field({id:'financial-from',label:'De',type:'date',value:period.from})+Field({id:'financial-to',label:'Até',type:'date',value:period.to})+Field({id:'financial-search',label:'Buscar'})});}
}

// Financial values, margins, valuation and reconciliation states are projection-owned. The browser formats and displays them; it never derives accounting or management totals from raw domain records.
