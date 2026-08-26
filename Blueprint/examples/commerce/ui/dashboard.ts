import {SemanticUiClient} from './api-client.js';
import {Card,StateView,Status,Table} from './design-system.js';

export type DashboardPeriod='today'|'7d'|'30d'|'month'|'custom';
export type DashboardSnapshot={period:{from:string;to:string;label:string};metrics:{sales:{amount:number;count:number};purchases:{amount:number;count:number};cash_flow:{in:number;out:number;balance:number}};stock_alerts:Array<{product:string;available:number;minimum:number}>;recent_activity:Array<{at:string;label:string;status:string}>;healing_required:Array<{id:string;intent:string;reason:string;created_at:string}>};

function status(label:string){return Status({label,tone:label==='ok'?'success':label==='healing'?'warning':'neutral'});}
function dataTable(caption:string,headers:string[],rows:Array<Array<string|number>>){return Table({caption,headers,rows});}

export class CommercialDashboard{
  constructor(private readonly api:SemanticUiClient){}
  load(period:DashboardPeriod,correlationId:string,custom?:{from:string;to:string}){
    return this.api.query('CommercialDashboardProjection',{period,...custom},correlationId,1,1);
  }
  render(state:{kind:'loading'}|{kind:'empty'}|{kind:'error';message:string}|{kind:'ready';data:DashboardSnapshot}){
    if(state.kind==='loading')return StateView('loading','Carregando dashboard comercial');
    if(state.kind==='empty')return StateView('empty','Nenhuma atividade comercial no período selecionado.');
    if(state.kind==='error')return StateView('error',state.message);
    const d=state.data,m=d.metrics;
    const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
    return `<section class="dashboard" aria-labelledby="dashboard-title"><header class="dashboard__header"><div><h1 id="dashboard-title">Dashboard</h1><p>${d.period.label}</p></div><form class="dashboard__period" aria-label="Período do dashboard"><label for="dashboard-period">Período</label><select id="dashboard-period" name="period"><option value="today">Hoje</option><option value="7d">7 dias</option><option value="30d">30 dias</option><option value="month">Este mês</option><option value="custom">Personalizado</option></select></form></header><div class="dashboard__metrics">${Card({title:'Vendas',body:`${money(m.sales.amount)} · ${m.sales.count} vendas`})}${Card({title:'Compras',body:`${money(m.purchases.amount)} · ${m.purchases.count} compras`})}${Card({title:'Fluxo de caixa',body:`${money(m.cash_flow.balance)} · entradas ${money(m.cash_flow.in)} · saídas ${money(m.cash_flow.out)}`})}</div><div class="dashboard__grid">${Card({title:'Alertas de estoque',body:d.stock_alerts.length?dataTable('Alertas de estoque',['Produto','Disponível','Mínimo'],d.stock_alerts.map(x=>[x.product,x.available,x.minimum])):'Sem alertas de estoque.'})}${Card({title:'Requer atenção',body:d.healing_required.length?dataTable('Itens aguardando resolução',['Intent','Motivo','Estado'],d.healing_required.map(x=>[x.intent,x.reason,status('healing')])):'Nenhum item aguardando resolução.'})}${Card({title:'Atividade recente',body:d.recent_activity.length?dataTable('Atividade recente',['Quando','Atividade','Estado'],d.recent_activity.map(x=>[x.at,x.label,status(x.status)])):'Nenhuma atividade recente.'})}</div></section>`;
  }
}

// All aggregates above are display-only values received from CommercialDashboardProjection.
// The browser never derives sales, purchase, cash-flow, stock or healing metrics from raw domain records.
