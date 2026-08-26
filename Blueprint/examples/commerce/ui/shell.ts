export type NavigationItem={id:string;label:string;href:string};
export const navigation:NavigationItem[]=[
  {id:'dashboard',label:'Dashboard',href:'/dashboard'},
  {id:'products',label:'Produtos',href:'/products'},
  {id:'stock',label:'Estoque',href:'/stock'},
  {id:'purchases',label:'Compras',href:'/purchases'},
  {id:'sales',label:'Vendas',href:'/sales'},
  {id:'financial',label:'Financeiro',href:'/financial'},
  {id:'customers',label:'Clientes',href:'/customers'},
  {id:'suppliers',label:'Fornecedores',href:'/suppliers'},
  {id:'reports',label:'Relatórios',href:'/reports'},
  {id:'settings',label:'Configurações',href:'/settings'},
];
function esc(v:string){return v.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));}
export function renderAppShell(input:{title:string;active:string;content:string;userLabel?:string}):string{
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(input.title)}</title><link rel="stylesheet" href="/ui/styles.css"></head><body><a class="skip-link" href="#main">Pular para o conteúdo</a><div class="app-shell"><header class="app-header"><button class="nav-toggle" aria-controls="primary-nav" aria-expanded="false">Menu</button><strong>AllasCode Commerce</strong><span aria-label="Usuário atual">${esc(input.userLabel??'Operador')}</span></header><aside class="app-sidebar"><nav id="primary-nav" aria-label="Navegação principal"><ul>${navigation.map(item=>`<li><a href="${item.href}" ${item.id===input.active?'aria-current="page"':''}>${esc(item.label)}</a></li>`).join('')}</ul></nav></aside><main id="main" tabindex="-1"><header class="page-header"><h1>${esc(input.title)}</h1></header>${input.content}</main></div></body></html>`;
}
