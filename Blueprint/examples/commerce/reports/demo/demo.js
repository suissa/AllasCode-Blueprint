const grid=document.getElementById('chartGrid');
const messages=document.getElementById('messages');
const instances=[];
const axis={axisLine:{lineStyle:{color:'rgba(255,255,255,.16)'}},axisLabel:{color:'#8791a6'},splitLine:{lineStyle:{color:'rgba(255,255,255,.055)'}}};
const tooltip={trigger:'axis',backgroundColor:'rgba(7,10,16,.94)',borderColor:'rgba(255,255,255,.12)',textStyle:{color:'#eef4ff'}};
const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago'];
const values=[120,168,145,210,244,230,295,338];
const rand=(n,min=10,max=100)=>Array.from({length:n},()=>Math.round(min+Math.random()*(max-min)));
const common=()=>({backgroundColor:'transparent',animationDuration:1100,animationEasing:'cubicOut',textStyle:{color:'#dce5f6'}});

const specs=[
 ['line','Linha / tendência',()=>({...common(),tooltip,xAxis:{type:'category',data:months,...axis},yAxis:{type:'value',...axis},series:[{type:'line',smooth:true,data:values,symbolSize:7,lineStyle:{width:3},areaStyle:{opacity:.05}}]})],
 ['area','Área / evolução',()=>({...common(),tooltip,xAxis:{type:'category',data:months,...axis},yAxis:{type:'value',...axis},series:[{type:'line',smooth:true,data:values,showSymbol:false,areaStyle:{opacity:.36}}]})],
 ['bar','Barras',()=>({...common(),tooltip,xAxis:{type:'category',data:months,...axis},yAxis:{type:'value',...axis},series:[{type:'bar',data:values,barMaxWidth:24,borderRadius:[8,8,0,0]}]})],
 ['stacked-bar','Barras empilhadas',()=>({...common(),tooltip,legend:{textStyle:{color:'#9ca6b8'}},xAxis:{type:'category',data:months,...axis},yAxis:{...axis},series:[{name:'Novos',type:'bar',stack:'t',data:rand(8,30,90)},{name:'Recorrentes',type:'bar',stack:'t',data:rand(8,40,110)}]})],
 ['pie','Pizza',()=>({...common(),tooltip:{trigger:'item'},series:[{type:'pie',radius:'68%',data:['Online','Loja','WhatsApp','Parceiros'].map((name,i)=>({name,value:[46,28,18,8][i]})),emphasis:{scale:true,scaleSize:10}}]})],
 ['donut','Donut',()=>({...common(),series:[{type:'pie',radius:['48%','72%'],label:{color:'#aeb8c9'},data:['A','B','C','D'].map((name,i)=>({name,value:[38,27,21,14][i]}))}]})],
 ['scatter','Dispersão',()=>({...common(),tooltip,xAxis:{...axis},yAxis:{...axis},series:[{type:'scatter',symbolSize:10,data:Array.from({length:30},(_,i)=>[i+1,Math.round(20+Math.sin(i/3)*18+Math.random()*22)])}]})],
 ['bubble','Bolhas',()=>({...common(),xAxis:{...axis},yAxis:{...axis},series:[{type:'scatter',data:Array.from({length:22},()=>[Math.random()*100,Math.random()*100,Math.random()*60+10]),symbolSize:v=>v[2]/2.2}]})],
 ['effect-scatter','Effect Scatter',()=>({...common(),tooltip,xAxis:{type:'category',data:months,...axis},yAxis:{...axis},series:[{type:'effectScatter',rippleEffect:{scale:3,brushType:'stroke'},symbolSize:v=>Math.max(9,v/18),data:values}]})],
 ['radar','Radar',()=>({...common(),radar:{indicator:['Receita','Margem','Giro','Retenção','Conversão'].map(name=>({name,max:100})),axisName:{color:'#aeb8c9'},splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}}},series:[{type:'radar',data:[{value:[88,72,63,81,69]}],areaStyle:{opacity:.24}}]})],
 ['gauge','Gauge',()=>({...common(),series:[{type:'gauge',progress:{show:true,width:14},axisLine:{lineStyle:{width:14}},axisTick:{show:false},splitLine:{show:false},axisLabel:{color:'#8e98aa'},detail:{valueAnimation:true,color:'#fff',fontSize:28},data:[{value:76,name:'Meta'}]}]})],
 ['funnel','Funil',()=>({...common(),series:[{type:'funnel',left:'12%',width:'76%',sort:'descending',label:{color:'#dce5f6'},data:[['Visitas',100],['Conversas',72],['Propostas',48],['Vendas',31]].map(([name,value])=>({name,value}))}]})],
 ['heatmap','Heatmap',()=>{const data=[];for(let x=0;x<7;x++)for(let y=0;y<6;y++)data.push([x,y,Math.round(Math.random()*100)]);return{...common(),tooltip,xAxis:{type:'category',data:['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],...axis},yAxis:{type:'category',data:['8h','10h','12h','14h','16h','18h'],...axis},visualMap:{min:0,max:100,show:false},series:[{type:'heatmap',data}]}}],
 ['candlestick','Candlestick',()=>({...common(),tooltip,xAxis:{type:'category',data:months,...axis},yAxis:{scale:true,...axis},series:[{type:'candlestick',data:[[120,130,112,138],[130,149,124,155],[149,141,135,156],[141,170,138,174],[170,186,165,193],[186,179,172,190],[179,205,176,211],[205,228,199,235]]}]})],
 ['tree','Árvore hierárquica',()=>({...common(),series:[{type:'tree',top:'8%',left:'10%',bottom:'8%',right:'20%',symbolSize:8,lineStyle:{color:'rgba(120,150,255,.45)'},label:{color:'#dce5f6'},leaves:{label:{color:'#aeb8c9'}},data:[{name:'Negócio',children:[{name:'Receita',children:[{name:'Vendas'},{name:'Serviços'}]},{name:'Operação',children:[{name:'Estoque'},{name:'Compras'}]},{name:'Relacionamento',children:[{name:'Clientes'},{name:'Marketing'}]}]}]}]})],
 ['treemap','Treemap',()=>({...common(),series:[{type:'treemap',roam:false,label:{color:'#fff'},data:[{name:'Bebidas',value:42},{name:'Alimentos',value:31},{name:'Serviços',value:18},{name:'Outros',value:9}]}]})],
 ['sunburst','Sunburst',()=>({...common(),series:[{type:'sunburst',radius:[25,'82%'],nodeClick:false,label:{color:'#fff'},data:[{name:'Receita',children:[{name:'Produtos',value:66,children:[{name:'A',value:34},{name:'B',value:32}]},{name:'Serviços',value:34}]}]}]})],
 ['sankey','Sankey',()=>({...common(),series:[{type:'sankey',layout:'none',emphasis:{focus:'adjacency'},label:{color:'#dce5f6'},data:['Leads','Chat','Loja','Venda','Recorrência'].map(name=>({name})),links:[['Leads','Chat',80],['Leads','Loja',35],['Chat','Venda',52],['Loja','Venda',25],['Venda','Recorrência',31]].map(([source,target,value])=>({source,target,value}))}]})],
 ['graph','Rede / Graph',()=>({...common(),series:[{type:'graph',layout:'force',roam:true,label:{show:true,color:'#fff'},force:{repulsion:120,edgeLength:90},data:['Cliente','Produto','Venda','Campanha','Canal','Fornecedor'].map((name,i)=>({name,value:20+i*7,symbolSize:22+i*3})),links:[[0,2],[1,2],[3,0],[4,3],[5,1],[2,3]].map(([source,target])=>({source,target}))}]})],
 ['parallel','Coordenadas paralelas',()=>({...common(),parallelAxis:['Ticket','Frequência','Margem','Recência'].map((name,dim)=>({dim,name,axisLabel:{color:'#8791a6'},nameTextStyle:{color:'#aeb8c9'}})),parallel:{left:45,right:25,bottom:35,top:45},series:[{type:'parallel',lineStyle:{width:2},data:Array.from({length:18},()=>rand(4,10,100))}]})],
 ['boxplot','Boxplot',()=>({...common(),xAxis:{type:'category',data:['A','B','C','D','E'],...axis},yAxis:{...axis},series:[{type:'boxplot',data:[[10,22,34,49,63],[18,28,41,56,74],[12,31,46,61,84],[20,35,48,65,88],[15,29,45,58,79]]}]})],
 ['pictorial-bar','Pictorial Bar',()=>({...common(),tooltip,xAxis:{type:'category',data:['A','B','C','D','E'],...axis},yAxis:{...axis},series:[{type:'pictorialBar',symbol:'roundRect',symbolRepeat:true,symbolSize:[18,7],symbolMargin:3,data:[52,76,44,92,68]}]})],
 ['theme-river','Theme River',()=>({...common(),singleAxis:{top:38,type:'time',axisLabel:{color:'#8791a6'},axisLine:{lineStyle:{color:'rgba(255,255,255,.15)'}}},series:[{type:'themeRiver',emphasis:{itemStyle:{shadowBlur:14,shadowColor:'rgba(0,0,0,.5)'}},data:[['2026/01/01',10,'Loja'],['2026/02/01',28,'Loja'],['2026/03/01',20,'Loja'],['2026/04/01',38,'Loja'],['2026/01/01',18,'WhatsApp'],['2026/02/01',22,'WhatsApp'],['2026/03/01',35,'WhatsApp'],['2026/04/01',48,'WhatsApp'],['2026/01/01',8,'Online'],['2026/02/01',14,'Online'],['2026/03/01',26,'Online'],['2026/04/01',30,'Online']]}]})],
 ['bar3d','Bar 3D / WebGL',()=>({...common(),tooltip:{},xAxis3D:{type:'category',data:['A','B','C','D'],axisLabel:{color:'#8e98aa'}},yAxis3D:{type:'category',data:['Q1','Q2','Q3'],axisLabel:{color:'#8e98aa'}},zAxis3D:{type:'value',axisLabel:{color:'#8e98aa'}},grid3D:{boxWidth:100,boxDepth:70,viewControl:{autoRotate:true,autoRotateSpeed:8},light:{main:{intensity:1.3},ambient:{intensity:.45}}},series:[{type:'bar3D',data:Array.from({length:12},(_,i)=>[i%4,Math.floor(i/4),Math.round(20+Math.random()*80)]),shading:'lambert'}]})],
 ['scatter3d','Scatter 3D / WebGL',()=>({...common(),xAxis3D:{type:'value'},yAxis3D:{type:'value'},zAxis3D:{type:'value'},grid3D:{viewControl:{autoRotate:true,autoRotateSpeed:12}},series:[{type:'scatter3D',symbolSize:7,data:Array.from({length:70},()=>[Math.random()*100,Math.random()*100,Math.random()*100])}]})],
 ['line3d','Linha 3D / WebGL',()=>({...common(),xAxis3D:{type:'value'},yAxis3D:{type:'value'},zAxis3D:{type:'value'},grid3D:{viewControl:{autoRotate:true}},series:[{type:'line3D',lineStyle:{width:5},data:Array.from({length:80},(_,i)=>{const t=i/9;return[Math.sin(t)*36,Math.cos(t)*36,t*8]})}]})],
 ['surface3d','Superfície 3D / WebGL',()=>{const data=[];for(let x=-20;x<=20;x+=2)for(let y=-20;y<=20;y+=2)data.push([x,y,Math.sin(Math.sqrt(x*x+y*y)/4)*8]);return{...common(),xAxis3D:{type:'value'},yAxis3D:{type:'value'},zAxis3D:{type:'value'},grid3D:{viewControl:{autoRotate:true,autoRotateSpeed:7},light:{main:{intensity:1.2},ambient:{intensity:.5}}},series:[{type:'surface',wireframe:{show:false},shading:'lambert',data}]}}]
];

specs.forEach(([kind,title,option],index)=>{
 const card=document.createElement('article');card.className=`chart-card ${index===0?'hero-chart':index%5===0?'wide':''}`;card.dataset.kind=kind;
 card.innerHTML=`<div class="card-head"><strong>${title}</strong><span>${kind.includes('3d')||kind==='surface3d'?'ECharts-GL • WebGL':'ECharts • animated'}</span></div><div class="chart"></div>`;grid.appendChild(card);
 const chart=echarts.init(card.querySelector('.chart'));chart.setOption(option());instances.push({chart,card,kind,title});
});
window.addEventListener('resize',()=>instances.forEach(x=>x.chart.resize()));

let cursor=0;
function reveal(count=2){for(let i=0;i<count&&cursor<instances.length;i++,cursor++){instances[cursor].card.classList.add('revealed');instances[cursor].chart.resize();instances[cursor].chart.setOption({animationDuration:1200});}}
function reveal3d(){instances.forEach(x=>{if(x.kind.includes('3d'))x.card.classList.add('revealed')});cursor=Math.max(cursor,instances.findIndex(x=>x.kind==='bar3d'))}
function addMessage(text,type){const el=document.createElement('div');el.className=`msg ${type}`;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight}
function respond(prompt){const lower=prompt.toLowerCase();if(lower.includes('3d')){reveal3d();addMessage('Ativei as projeções WebGL 3D. Arraste para orbitar; alguns exemplos rotacionam automaticamente.','agent');return}const amount=lower.includes('tudo')?instances.length:lower.includes('tend')||lower.includes('compos')?5:3;reveal(amount);addMessage(`Revelei mais ${Math.min(amount,instances.length)} elementos. A conversa permanece na frente e as projeções entram atrás com animação progressiva.`, 'agent')}

document.getElementById('chatForm').addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('chatInput');const value=input.value.trim();if(!value)return;addMessage(value,'user');input.value='';setTimeout(()=>respond(value),220)});
document.querySelectorAll('[data-prompt]').forEach(btn=>btn.addEventListener('click',()=>{const p=btn.dataset.prompt;addMessage(p,'user');setTimeout(()=>respond(p),180)}));
document.getElementById('revealAll').addEventListener('click',()=>{instances.forEach(x=>x.card.classList.add('revealed'));cursor=instances.length;addMessage('Todos os componentes foram revelados.','agent')});
function toast(text){const el=document.getElementById('shareToast');el.textContent=text;el.hidden=false;clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.hidden=true,6500)}
document.getElementById('previewPng').addEventListener('click',()=>{const item=instances.find(x=>x.card.classList.contains('revealed'))||instances[0];item.card.classList.add('revealed');const data=item.chart.getDataURL({type:'png',pixelRatio:2,backgroundColor:'#030407'});const a=document.createElement('a');a.href=data;a.download='allascode-report-preview.png';a.click();toast('PNG gerado pelo ECharts getDataURL() com fundo #030407 — formato pronto para preview de compartilhamento.')});
document.getElementById('shareLink').addEventListener('click',async()=>{const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);const token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');const url=`${location.origin}${location.pathname}?share=${token}`;try{await navigator.clipboard.writeText(url);toast(`Link único copiado: ${url}`)}catch{toast(`Link único: ${url}`)}});

const sharedToken=new URLSearchParams(location.search).get('share');
if(sharedToken){
 addMessage('Relatório compartilhado carregado. Vou apresentar cada componente automaticamente.','agent');
 const playback=setInterval(()=>{reveal(1);if(cursor>=instances.length)clearInterval(playback)},520);
}else reveal(2);
