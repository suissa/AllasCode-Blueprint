import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SemanticGraphEdge, SemanticGraphNode } from '../runtime/semantic-graph.js';
import type { SemanticPrDiff } from '../runtime/semantic-pr-diff.js';

const root = join(import.meta.dirname, '..');
const dashboard = join(root, 'tests', 'dashboard');
const diff = JSON.parse(await readFile(join(dashboard, 'semantic-pr-diff.json'), 'utf8')) as SemanticPrDiff;

type Decision = 'ALLOW' | 'REVIEW' | 'BLOCK';
type Finding = { decision: Exclude<Decision, 'ALLOW'>; reason: string; semantic_id: string };

const protectedNodeTypes = new Set(['Invariant', 'Law', 'Policy', 'HealingStrategy']);
const protectedEdgeTypes = new Set([
  'EMITS_OK', 'EMITS_ERROR', 'STARTS_WITH', 'SUCCEEDS_WITH',
  'IMPLEMENTS_INTENT', 'ACTION_OWNER', 'OWNS_ACTOR', 'ACCEPTS_ACTION',
  'ALLOWS_ACTION', 'ENTITY_RELATION', 'HEALED_BY', 'FALLBACK_TO',
]);

const findings: Finding[] = [];
const add = (decision: 'REVIEW' | 'BLOCK', reason: string, semantic_id: string) => findings.push({ decision, reason, semantic_id });

function removedNode(node: SemanticGraphNode) {
  if (protectedNodeTypes.has(node.type)) add('BLOCK', `protected ${node.type} removed`, node.id);
  else if (node.type === 'Event') add('BLOCK', 'event contract removed', node.id);
  else if (node.type === 'Action' || node.type === 'Intent' || node.type === 'Entity') add('REVIEW', `${node.type} removed`, node.id);
}

function changedNode(node: SemanticGraphNode) {
  if (protectedNodeTypes.has(node.type)) add('BLOCK', `protected ${node.type} changed`, node.id);
  else if (node.type === 'Event') add('BLOCK', 'event contract changed', node.id);
  else if (node.type === 'Action' || node.type === 'Intent' || node.type === 'Entity') add('REVIEW', `${node.type} changed`, node.id);
}

function removedEdge(edge: SemanticGraphEdge) {
  if (protectedEdgeTypes.has(edge.type)) add('BLOCK', `critical relation ${edge.type} removed`, edge.id);
  else add('REVIEW', `semantic relation ${edge.type} removed`, edge.id);
}

function metadataIsAdditive(before: SemanticGraphEdge, after: SemanticGraphEdge): boolean {
  const previous = before.metadata ?? {};
  const next = after.metadata ?? {};
  return Object.entries(previous).every(([key,value]) => JSON.stringify(next[key]) === JSON.stringify(value));
}

function changedEdge(before: SemanticGraphEdge, after: SemanticGraphEdge) {
  if (after.type === 'FALLBACK_TO' && before.from === after.from && before.to === after.to && metadataIsAdditive(before, after) && typeof after.metadata?.when_strategy === 'string') {
    add('REVIEW', 'FALLBACK_TO contract was strengthened additively with a graph-bound healing strategy; future removal/change remains blocking', after.id);
    return;
  }
  if (protectedEdgeTypes.has(after.type)) add('BLOCK', `critical relation ${after.type} changed`, after.id);
  else add('REVIEW', `semantic relation ${after.type} changed`, after.id);
}

for (const node of diff.nodes.removed) removedNode(node);
for (const change of diff.nodes.changed) changedNode(change.after);
for (const edge of diff.edges.removed) removedEdge(edge);
for (const change of diff.edges.changed) changedEdge(change.before, change.after);

const decision: Decision = findings.some(f => f.decision === 'BLOCK') ? 'BLOCK' : findings.length ? 'REVIEW' : 'ALLOW';
const report = { version: '0.3.0', decision, findings, summary: { blocks: findings.filter(f => f.decision === 'BLOCK').length, reviews: findings.filter(f => f.decision === 'REVIEW').length } };
await writeFile(join(dashboard, 'semantic-merge-gate.json'), `${JSON.stringify(report, null, 2)}\n`);

const lines = [
  '<!-- allascode-semantic-merge-gate -->',
  '## Semantic Merge Gate', '',
  `Decision: **${decision}**`,
  `Blocking findings: **${report.summary.blocks}**  `,
  `Review findings: **${report.summary.reviews}**`,
];
if (findings.length) lines.push('', ...findings.map(f => `- **${f.decision}** \`${f.semantic_id}\` — ${f.reason}`));
await writeFile(join(dashboard, 'semantic-merge-gate.md'), `${lines.join('\n')}\n`);

console.log(`Semantic merge gate: ${decision} (${report.summary.blocks} blocks, ${report.summary.reviews} reviews)`);
if (decision === 'BLOCK') process.exitCode = 1;
