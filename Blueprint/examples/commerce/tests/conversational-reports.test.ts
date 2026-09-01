import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ConversationalReportSession,ReportShareService,assertProjectionBacked,type ReportDocument,type ReportPreviewRendererPort } from '../reports/reporting.js';

const report:ReportDocument={report_id:'report-42',owner_context_id:'tenant-a',title:'Resumo comercial',correlation_id:'corr-42',generated_at:'2026-09-01T12:00:00.000Z',widgets:[
 {widget_id:'w2',kind:'bar3d',title:'Produtos x margem',order:2,projection:'ProductMarginProjection',data:[[0,0,10]],animation:'orbit'},
 {widget_id:'w1',kind:'metric',title:'Receita',order:1,projection:'FinancialSummaryProjection',data:{value:1200},animation:'fade'},
 {widget_id:'w3',kind:'line',title:'Receita mensal',order:3,projection:'MonthlyRevenueProjection',data:[1,2,3],animation:'rise'}
]};

test('chat reveals projection widgets progressively in declared order',()=>{const session=new ConversationalReportSession(report);const first=session.revealNext();assert.equal(first.outcome,'Ok');if(first.outcome==='Ok')assert.equal(first.value[0].widget_id,'w1');const next=session.revealNext(2);assert.equal(next.outcome,'Ok');assert.deepEqual(session.visible().map(x=>x.widget_id),['w1','w2','w3']);});

test('share link token is opaque, expiring and owner-revocable',()=>{let now=Date.parse('2026-09-01T12:00:00Z');const shares=new ReportShareService('https://reports.example',()=>new Date(now));const made=shares.create(report,1000);assert.equal(made.outcome,'Ok');if(made.outcome==='Error')return;assert.ok(made.value.share.token.length>=32);assert.equal(made.value.share.token.includes(report.report_id),false);assert.match(made.value.url,/\/reports\/share\//);assert.equal(shares.revoke(made.value.share.token,'other').outcome,'Error');assert.equal(shares.resolve(made.value.share.token).outcome,'Ok');now+=1001;assert.equal(shares.resolve(made.value.share.token).outcome,'Error');});

test('WhatsApp share package contains PNG preview and same unique report link',async()=>{const shares=new ReportShareService('https://reports.example');const preview:ReportPreviewRendererPort={renderPng:async(_r,url)=>({outcome:'Ok',value:{image_url:`https://cdn.example/preview.png?for=${encodeURIComponent(url)}`}})};const result=await shares.whatsApp(report,preview);assert.equal(result.outcome,'Ok');if(result.outcome==='Error')return;assert.equal(result.value.mime_type,'image/png');assert.match(result.value.preview_image_url,/preview\.png/);assert.ok(result.value.caption.includes(result.value.share_url));});

test('all report widgets are projection-backed',()=>{assert.deepEqual(assertProjectionBacked(report),{outcome:'Ok',value:true});const invalid={...report,widgets:[{...report.widgets[0],projection:''}]};assert.equal(assertProjectionBacked(invalid).outcome,'Error');});

test('demo is always dark glassmorphism and demonstrates animated 2D plus WebGL 3D families',async()=>{const root=new URL('../reports/demo/',import.meta.url);const [html,css,js]=await Promise.all([readFile(new URL('index.html',root),'utf8'),readFile(new URL('styles.css',root),'utf8'),readFile(new URL('demo.js',root),'utf8')]);assert.match(html,/echarts-gl@2/);assert.match(html,/class="chat glass"/);assert.match(css,/--bg:#030407/);assert.match(css,/backdrop-filter:blur/);for(const kind of ['line','area','bar','stacked-bar','pie','donut','scatter','bubble','effect-scatter','radar','gauge','funnel','heatmap','candlestick','tree','treemap','sunburst','sankey','graph','parallel','boxplot','pictorial-bar','theme-river','bar3d','scatter3d','line3d','surface3d'])assert.ok(js.includes(`'${kind}'`),kind);assert.match(js,/getDataURL\(\{type:'png'/);assert.match(js,/crypto\.getRandomValues/);assert.match(js,/new URLSearchParams\(location\.search\)\.get\('share'\)/);assert.match(js,/setInterval\(\(\)=>\{reveal\(1\)/);});
