import type { SemanticGraph, SemanticGraphEdge, SemanticGraphNode } from './semantic-graph.js';

export interface SemanticGraphDelta<T> {
  added: T[];
  removed: T[];
  changed: Array<{ before: T; after: T }>;
}

export interface SemanticPrDiff {
  nodes: SemanticGraphDelta<SemanticGraphNode>;
  edges: SemanticGraphDelta<SemanticGraphEdge>;
  summary: {
    node_additions: number;
    node_removals: number;
    node_changes: number;
    edge_additions: number;
    edge_removals: number;
    edge_changes: number;
    breaking_changes: number;
  };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function delta<T extends { id: string }>(before: T[], after: T[]): SemanticGraphDelta<T> {
  const left = new Map(before.map(item => [item.id, item]));
  const right = new Map(after.map(item => [item.id, item]));
  const added: T[] = [];
  const removed: T[] = [];
  const changed: Array<{ before: T; after: T }> = [];

  for (const [id, item] of right) {
    const old = left.get(id);
    if (!old) added.push(item);
    else if (stable(old) !== stable(item)) changed.push({ before: old, after: item });
  }
  for (const [id, item] of left) if (!right.has(id)) removed.push(item);

  const sort = <U extends { id: string }>(items: U[]) => items.sort((a, b) => a.id.localeCompare(b.id));
  return { added: sort(added), removed: sort(removed), changed: changed.sort((a, b) => a.after.id.localeCompare(b.after.id)) };
}

export function diffSemanticGraphs(base: SemanticGraph, head: SemanticGraph): SemanticPrDiff {
  const nodes = delta(base.nodes, head.nodes);
  const edges = delta(base.edges, head.edges);
  const breakingChanges = nodes.removed.length + edges.removed.length + nodes.changed.length + edges.changed.length;
  return {
    nodes,
    edges,
    summary: {
      node_additions: nodes.added.length,
      node_removals: nodes.removed.length,
      node_changes: nodes.changed.length,
      edge_additions: edges.added.length,
      edge_removals: edges.removed.length,
      edge_changes: edges.changed.length,
      breaking_changes: breakingChanges,
    },
  };
}

export function renderSemanticPrDiffMarkdown(diff: SemanticPrDiff, context?: { risk?: string; risk_score?: number; required_tests?: number; confidence_percent?: number }): string {
  const lines = [
    '<!-- allascode-semantic-pr-diff -->',
    '## Semantic PR Diff',
    '',
    `Risk: **${context?.risk ?? 'UNKNOWN'}**${context?.risk_score != null ? ` (${context.risk_score})` : ''}  `,
    `Required tests: **${context?.required_tests ?? 0}**  `,
    `Selector confidence: **${context?.confidence_percent ?? 0}%**`,
    '',
    '| Change | Added | Removed | Changed |',
    '|---|---:|---:|---:|',
    `| Nodes | ${diff.summary.node_additions} | ${diff.summary.node_removals} | ${diff.summary.node_changes} |`,
    `| Edges | ${diff.summary.edge_additions} | ${diff.summary.edge_removals} | ${diff.summary.edge_changes} |`,
    '',
    `Breaking semantic changes: **${diff.summary.breaking_changes}**`,
  ];

  const section = (title: string, values: string[]) => {
    if (!values.length) return;
    lines.push('', `<details><summary>${title} (${values.length})</summary>`, '', ...values.map(value => `- \`${value}\``), '', '</details>');
  };

  section('Added nodes', diff.nodes.added.map(node => node.id));
  section('Removed nodes', diff.nodes.removed.map(node => node.id));
  section('Changed nodes', diff.nodes.changed.map(node => node.after.id));
  section('Added edges', diff.edges.added.map(edge => `${edge.type}: ${edge.from} → ${edge.to}`));
  section('Removed edges', diff.edges.removed.map(edge => `${edge.type}: ${edge.from} → ${edge.to}`));
  section('Changed edges', diff.edges.changed.map(edge => `${edge.after.type}: ${edge.after.from} → ${edge.after.to}`));

  return `${lines.join('\n')}\n`;
}
