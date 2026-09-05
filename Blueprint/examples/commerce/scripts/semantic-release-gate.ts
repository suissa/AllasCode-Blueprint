import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import YAML from 'yaml';
import type { SemanticGraph } from '../runtime/semantic-graph.js';

const root=join(import.meta.dirname,'..');
const config=YAML.parse(await readFile(join(root,'release-gates.yml'),'utf8')) as any;
const graph=JSON.parse(await readFile(join(root,'generated','semantic-graph.json'),'utf8')) as SemanticGraph;
const coverage=JSON.parse(await readFile(join(root,'tests','dashboard','semantic-coverage.json'),'utf8')) as any;
const mutation=JSON.parse(await readFile(join(root,'tests','dashboard','semantic-mutation.json'),'utf8')) as any;
const selector=JSON.parse(await readFile(join(root,'tests','dashboard','selector-confidence.json'),'utf8')) as any;
const failures:string[]=[];
const passed:string[]=[];

for(const [kind,target] of Object.entries(config.coverage.artifact_types as Record<string,number>)){
  const actual=Number(coverage.coverage?.[kind]?.percent??0);
  if(actual<target) failures.push(`${kind} coverage ${actual.toFixed(2)}% < ${target}%`); else passed.push(`${kind} coverage ${actual.toFixed(2)}%`);
}
for(const [kind,target] of Object.entries(config.coverage.governance as Record<string,number>)){
  const actual=Number(coverage.coverage?.[kind]?.percent??0);
  if(actual<target) failures.push(`${kind} PROVES coverage ${actual.toFixed(2)}% < ${target}%`); else passed.push(`${kind} PROVES coverage ${actual.toFixed(2)}%`);
}
const edgeCoverage=Number(coverage.graph_edges?.percent??0);
if(edgeCoverage<config.coverage.graph_edges_percent) failures.push(`graph edge exercise ${edgeCoverage.toFixed(2)}% < ${config.coverage.graph_edges_percent}%`); else passed.push(`graph edge exercise ${edgeCoverage.toFixed(2)}%`);
if(Number(mutation.score_percent??0)<config.mutation.score_percent) failures.push(`mutation score ${mutation.score_percent}% < ${config.mutation.score_percent}%`); else passed.push(`mutation score ${mutation.score_percent}%`);
if(Number(selector.confidence_percent??selector.recall_percent??0)<config.selector.confidence_percent) failures.push(`selector confidence below ${config.selector.confidence_percent}%`); else passed.push(`selector confidence ${selector.confidence_percent??selector.recall_percent}%`);

const critical=new Set(graph.nodes.filter(n=>['Invariant','Policy','Law'].includes(n.type)).filter(n=>graph.edges.some(e=>e.to===n.id&&['PRESERVES','GOVERNED_BY','PRESERVES_LAW'].includes(e.type))).map(n=>n.id));
const currentViolations=graph.edges.filter(e=>e.type==='VIOLATES'&&critical.has(e.to)).filter(e=>{const r=graph.nodes.find(n=>n.id===e.from);return r?.type==='TestResult'&&r.metadata?.status==='failed';});
if(config.governance.forbid_current_violates&&currentViolations.length) failures.push(`current release-critical VIOLATES edges: ${currentViolations.map(e=>`${e.from}->${e.to}`).join(', ')}`); else passed.push('no current release-critical VIOLATES edge');

const report={version:'1.0',release:config.release,decision:failures.length?'BLOCK':'ALLOW',generated_at:new Date().toISOString(),thresholds:config,passed,failures};
await writeFile(join(root,'tests','dashboard','semantic-release-gate.json'),JSON.stringify(report,null,2)+'\n');
await writeFile(join(root,'tests','dashboard','semantic-release-gate.md'),`## Semantic Release Gate\n\nDecision: **${report.decision}**\n\n${failures.length?failures.map(x=>`- BLOCK: ${x}`).join('\n'):'All configured v1 semantic release thresholds are satisfied.'}\n`);
console.log(`Semantic release gate: ${report.decision} (${passed.length} passed, ${failures.length} failed)`);
if(failures.length) process.exitCode=1;
