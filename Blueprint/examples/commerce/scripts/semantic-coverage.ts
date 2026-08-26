import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SemanticGraph, SemanticGraphEdge } from '../runtime/semantic-graph.js';

const root=join(import.meta.dirname,'..');
const graph=JSON.parse(await readFile(join(root,'generated','semantic-graph.json'),'utf8')) as SemanticGraph;
const kinds=['Action','Actor','Agent','Tool','Flow','Intent','Entity'] as const;
const resultByTest=new Map<string,string>();
for(const edge of graph.edges.filter(e=>e.type==='PRODUCES')) resultByTest.set(edge.from,edge.to);
function passed(resultId:string|undefined):boolean { const n=graph.nodes.find(x=>x.id===resultId); return n?.type==='TestResult'&&n.metadata?.status==='passed'; }
function nodeHasPassingTest(nodeId:string):boolean {
  const tests=graph.edges.filter(e=>e.type==='TESTED_BY'&&e.from===nodeId).map(e=>e.to);
  return tests.some(t=>passed(resultByTest.get(t)));
}
const coverage:Record<string,{total:number;covered:number;percent:number}>={};
for(const kind of kinds){
  const nodes=graph.nodes.filter(n=>n.type===kind); let covered=0;
  for(const node of nodes) if(nodeHasPassingTest(node.id)) covered++;
  coverage[kind]={total:nodes.length,covered,percent:nodes.length?covered/nodes.length*100:100};
}
const obligations=['Invariant','Policy','Law'] as const;
for(const kind of obligations){
  const nodes=graph.nodes.filter(n=>n.type===kind); let covered=0;
  for(const node of nodes){ const proofs=graph.edges.filter(e=>e.type==='PROVES'&&e.to===node.id); if(proofs.some(e=>passed(e.from))) covered++; }
  coverage[kind]={total:nodes.length,covered,percent:nodes.length?covered/nodes.length*100:100};
}
const edgeTypes=['LISTENS','DISPATCHES','EMITS_OK','EMITS_ERROR','OWNS_ACTOR','ACCEPTS_ACTION','IMPLEMENTS_INTENT','PRESERVES','GOVERNED_BY'];
const edges=graph.edges.filter(e=>edgeTypes.includes(e.type));
function edgeIsExercised(edge:SemanticGraphEdge):boolean {
  if(edge.type==='DISPATCHES') {
    const agent=String(edge.metadata?.agent??'');
    return agent.length>0 && nodeHasPassingTest(`Agent:${agent}`) && nodeHasPassingTest(edge.to);
  }
  return nodeHasPassingTest(edge.from);
}
const exercisedEdges=edges.filter(edgeIsExercised);
const unexercisedEdges=edges.filter(e=>!edgeIsExercised(e)).map(e=>({id:e.id,type:e.type,from:e.from,to:e.to,metadata:e.metadata??{}}));
const report={generated_at:new Date().toISOString(),coverage,graph_edges:{total:edges.length,exercised:exercisedEdges.length,percent:edges.length?exercisedEdges.length/edges.length*100:100,unexercised:unexercisedEdges}};
await writeFile(join(root,'tests','dashboard','semantic-coverage.json'),JSON.stringify(report,null,2)+'\n');
const required=['Action','Actor','Agent','Tool','Flow','Intent','Entity'];
const failures=required.filter(k=>coverage[k]!.percent<100);
if(failures.length) throw new Error(`Semantic coverage incomplete: ${failures.map(k=>`${k}=${coverage[k]!.percent.toFixed(1)}%`).join(', ')}`);
console.log('Semantic coverage:',Object.fromEntries(required.map(k=>[k,`${coverage[k]!.covered}/${coverage[k]!.total}`])));
console.log(`Governance proofs: Invariant ${coverage.Invariant!.covered}/${coverage.Invariant!.total}, Policy ${coverage.Policy!.covered}/${coverage.Policy!.total}, Law ${coverage.Law!.covered}/${coverage.Law!.total}`);
console.log(`Graph edge exercise: ${exercisedEdges.length}/${edges.length} (${report.graph_edges.percent.toFixed(1)}%)`);
if(unexercisedEdges.length) console.log('Unexercised graph edges:',unexercisedEdges.map(e=>e.id).join(', '));
