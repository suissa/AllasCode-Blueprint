import { createExecutionKernel } from './execution-kernel.js';
import { InMemoryEventBus } from './event-bus.js';
import { FlowRuntime } from './flow-runtime.js';
import { snapshot } from './state.js';
import { createDeterministicSandboxState } from '../sandbox/seed.js';
import { SandboxWhatsAppProvider, SandboxPaymentProvider, SandboxFiscalProvider } from '../sandbox/providers.js';

const state=createDeterministicSandboxState();
const kernel=await createExecutionKernel();
const bus=new InMemoryEventBus();
const runtime=new FlowRuntime(state,kernel.agents,bus,kernel.graph);
const whatsapp=new SandboxWhatsAppProvider();
const payments=new SandboxPaymentProvider();
const fiscal=new SandboxFiscalProvider();

const purchase=await runtime.execute('purchase-products',{purchase_id:'demo-purchase-002',supplier_id:'supplier-market-001',supplier_name:'Mercado Sandbox',currency:'BRL',items:[{product_id:'soda-350',name:'Soda 350ml',quantity:12,unit_price:2.5}]});
const detected=payments.detect({sale_id:'demo-sale-002',amount:12,currency:'BRL'});
await whatsapp.sendText('5511999999999','Venda de R$ 12 detectada. Quais produtos foram vendidos?');
const healing={status:'waiting-human',reason:'products-missing',sale_id:detected.sale_id};
const sale=await runtime.execute('process-sale',{sale_id:'demo-sale-002',currency:'BRL',items:[{product_id:'beer-350',name:'Beer 350ml',quantity:2,unit_price:6}],customer_id:'customer-001',operator_id:'operator-001'});
const invoice=fiscal.issue({invoice_id:'demo-invoice-001',sale_id:'demo-sale-002',amount:12,currency:'BRL'});

console.log(JSON.stringify({mode:'sandbox',purchase,healing,sale,invoice,whatsapp:whatsapp.outbound,state:snapshot(state),events:bus.history},null,2));
