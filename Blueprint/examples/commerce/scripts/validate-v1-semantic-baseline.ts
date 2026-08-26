import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { compileRuntimeSemanticGraph } from '../runtime/runtime-graph.js';
import { compileSemanticTests } from '../runtime/test-graph.js';
import { governSemanticGraph } from '../runtime/semantic-governor.js';

const root = join(import.meta.dirname, '..');
const graph = await compileRuntimeSemanticGraph(root);
const testErrors = await compileSemanticTests(root, graph);
const governance = governSemanticGraph(graph);

const blocking: string[] = [...testErrors, ...governance.errors];
const warnings: string[] = [];
const passed: string[] = [];

const nodes = (type: string) => graph.nodes.filter(node => node.type === type);
const edgesFrom = (from: string, type: string) => graph.edges.filter(edge => edge.from === from && edge.type === type);
const incoming = (to: string, type: string) => graph.edges.filter(edge => edge.to === to && edge.type === type);

for (const action of nodes('Action')) {
  const owner = edgesFrom(action.id, 'ACTION_OWNER');
  const ok = edgesFrom(action.id, 'EMITS_OK');
  const error = edgesFrom(action.id, 'EMITS_ERROR');
  if (owner.length !== 1) blocking.push(`${action.id} must have exactly one ACTION_OWNER, found ${owner.length}`);
  if (ok.length !== 1) blocking.push(`${action.id} must have exactly one EMITS_OK, found ${ok.length}`);
  if (error.length !== 1) blocking.push(`${action.id} must have exactly one EMITS_ERROR, found ${error.length}`);
  for (const resultEdge of [...ok, ...error]) {
    const schema = edgesFrom(resultEdge.to, 'VALIDATED_BY');
    if (schema.length < 1) blocking.push(`${resultEdge.to} emitted by ${action.id} has no VALIDATED_BY schema`);
  }
}
if (!blocking.some(e => e.includes('EMITS_') || e.includes('ACTION_OWNER') || e.includes('VALIDATED_BY'))) passed.push('Every active Action has one owner and explicit Ok/Error schema-validated terminal events.');

for (const flow of nodes('Flow')) {
  const impl = edgesFrom(flow.id, 'IMPLEMENTS_INTENT');
  if (impl.length !== 1) { blocking.push(`${flow.id} must implement exactly one Intent, found ${impl.length}`); continue; }
  const intent = graph.nodes.find(node => node.id === impl[0]!.to);
  if (!intent) { blocking.push(`${flow.id} implements missing Intent ${impl[0]!.to}`); continue; }
  const starts = edgesFrom(intent.id, 'STARTS_WITH');
  const succeeds = edgesFrom(intent.id, 'SUCCEEDS_WITH');
  if (starts.length !== 1) blocking.push(`${intent.id} is active but has ${starts.length} STARTS_WITH edges`);
  if (succeeds.length < 1) blocking.push(`${intent.id} is active but has no SUCCEEDS_WITH edge`);
  const first = edgesFrom(flow.id, 'FLOW_EMITS_EVENT').sort((a,b)=>Number(a.metadata?.order??0)-Number(b.metadata?.order??0))[0];
  if (first && starts[0] && first.to !== starts[0].to) blocking.push(`${flow.id} starts with ${first.to} but ${intent.id} declares ${starts[0].to}`);
  const terminal = edgesFrom(flow.id, 'FLOW_EXPECTS_EVENT').sort((a,b)=>Number(a.metadata?.order??0)-Number(b.metadata?.order??0)).at(-1);
  if (terminal && succeeds.length && !succeeds.some(edge => edge.to === terminal.to)) blocking.push(`${flow.id} terminal ${terminal.to} is not a success event of ${intent.id}`);
}
if (!blocking.some(e => e.includes('Intent') || e.includes('Flow:') || e.includes('STARTS_WITH') || e.includes('SUCCEEDS_WITH'))) passed.push('Every configured Flow resolves to one typed active Intent with aligned initial and success events.');

const forbiddenDirect = graph.edges.filter(edge => {
  const from = graph.nodes.find(node => node.id === edge.from);
  const to = graph.nodes.find(node => node.id === edge.to);
  if (!from || !to) return false;
  if (from.type === 'Agent' && to.type === 'Agent') return true;
  if (from.type === 'Entity' && to.type === 'Entity' && edge.type !== 'ENTITY_RELATION') return true;
  return false;
});
for (const edge of forbiddenDirect) blocking.push(`Direct cross-boundary relation is forbidden: ${edge.type} ${edge.from} -> ${edge.to}`);
if (!forbiddenDirect.length) passed.push('No direct Agent→Agent or undeclared Entity→Entity operational coupling exists in the graph.');

const activeIntentIds = new Set(graph.edges.filter(edge => edge.type === 'IMPLEMENTS_INTENT').map(edge => edge.to));
for (const intent of nodes('Intent')) {
  if (!activeIntentIds.has(intent.id) && edgesFrom(intent.id, 'STARTS_WITH').length === 0) warnings.push(`${intent.id} is legacy/inactive and remains outside the executable v1 baseline.`);
}

for (const governed of nodes('Invariant').concat(nodes('Policy'), nodes('Law'))) {
  const required = incoming(governed.id, 'PRESERVES').length + incoming(governed.id, 'GOVERNED_BY').length + incoming(governed.id, 'PRESERVES_LAW').length > 0;
  if (!required) continue;
  const proofs = incoming(governed.id, 'PROVES').filter(edge => {
    const result = graph.nodes.find(node => node.id === edge.from);
    return result?.type === 'TestResult' && result.metadata?.status === 'passed';
  });
  if (!proofs.length) warnings.push(`${governed.id} is release-relevant but currently has no passing PROVES evidence in this baseline run.`);
}

const planned = ['Product','Inventory','Purchase','Sale','Payment','Financial','Customer','Supplier','Invoice','AccountingEntry','User'];
const existingEntities = new Set(nodes('Entity').map(node => node.label));
const missingPlanned = planned.filter(name => !existingEntities.has(name));
if (missingPlanned.length) warnings.push(`Planned v1 domain responsibilities not yet represented as Entity nodes: ${missingPlanned.join(', ')}. Tracked by #26 and related roadmap issues.`);

const report = {
  version: '1.0-candidate',
  status: blocking.length ? 'FAILED' : 'CANDIDATE_VALID',
  summary: { nodes: graph.nodes.length, edges: graph.edges.length, actions: nodes('Action').length, flows: nodes('Flow').length, intents: nodes('Intent').length, blocking: blocking.length, warnings: warnings.length },
  passed,
  blocking,
  warnings,
};
await mkdir(join(root,'tests','dashboard'),{recursive:true});
await writeFile(join(root,'tests','dashboard','v1-semantic-baseline.json'),`${JSON.stringify(report,null,2)}\n`,'utf8');
console.log(JSON.stringify(report,null,2));
if (blocking.length) process.exitCode = 1;
