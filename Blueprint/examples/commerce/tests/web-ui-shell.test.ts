import test from 'node:test';import assert from 'node:assert/strict';
import {navigation,renderAppShell} from '../ui/shell.js';
import {Card,Dialog,Field,Filters,Notification,StateView,Status,Table} from '../ui/design-system.js';
import {SemanticUiClient} from '../ui/api-client.js';

test('navigation covers the complete v1 commercial shell',()=>{assert.deepEqual(navigation.map(x=>x.id),['dashboard','products','stock','purchases','sales','financial','customers','suppliers','reports','settings']);});

test('shell provides responsive and accessibility landmarks',()=>{const html=renderAppShell({title:'Estoque',active:'stock',content:'<p>conteúdo</p>'});assert.match(html,/lang="pt-BR"/);assert.match(html,/name="viewport"/);assert.match(html,/Pular para o conteúdo/);assert.match(html,/aria-label="Navegação principal"/);assert.match(html,/aria-current="page"/);assert.match(html,/<main id="main" tabindex="-1">/);});

test('design system exposes forms tables cards status dialogs filters notifications and consistent states',()=>{assert.match(Field({id:'name',label:'Nome',required:true}),/<label/);assert.match(Table({caption:'Produtos',headers:['Nome'],rows:[['Beer']]}),/<caption>Produtos<\/caption>/);assert.match(Card({title:'Resumo',body:'ok'}),/ui-card/);assert.match(Status({label:'Ativo',tone:'success'}),/role="status"/);assert.match(Dialog({id:'confirm',title:'Confirmar',body:'x'}),/<dialog/);assert.match(Filters({label:'Filtros',content:'x'}),/aria-label="Filtros"/);assert.match(Notification({message:'Salvo'}),/aria-live="polite"/);assert.match(StateView('loading'),/Carregando/);assert.match(StateView('empty'),/Nenhum dado/);assert.match(StateView('error'),/role="alert"/);});

test('UI client addresses only Intents and Projections',async()=>{const requests:any[]=[];const client=new SemanticUiClient({async request(input){requests.push(input);return{version:'v1',correlation_id:'c',outcome:'Ok'};}},{id:'u1',permissions:['*']});await client.command('ProcessSaleIntent',{sale_id:'s1'},'c1','i1');await client.query('inventory',{product_id:'beer'},'c2');assert.equal(requests[0].path,'/v1/intents/ProcessSaleIntent');assert.match(requests[1].path,/^\/v1\/projections\?/);assert.equal(JSON.stringify(requests).includes('action'),false);assert.equal(JSON.stringify(requests).includes('agent'),false);});
