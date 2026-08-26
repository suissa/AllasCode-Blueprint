import type { SemanticGraph } from './semantic-graph.js';

export interface SemanticImpactReport {
  changed_files: string[];
  seed_nodes: string[];
  impacted_nodes: string[];
  required_tests: string[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
}

const ARCH_TYPES = new Set(['Entity','Intent','Event','Agent','Actor','Action','Tool','Flow','Context','Capability','Policy','Invariant','Law','Constraint','Schema','Property','Artifact']);
const HIGH_TYPES = new Set(['Action','Flow','Policy','Invariant','Law','Constraint','Schema']);
const CRITICAL_TYPES = new Set(['Policy','Invariant','Law','Constraint']);

function kebab(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
}

export function mapChangedFilesToSeeds(graph: SemanticGraph, changedFiles: string[]): string[] {
  const seeds = new Set<string>();
  const architectureNodes = graph.nodes.filter(node => ARCH_TYPES.has(node.type));
  for (const file of changedFiles) {
    const normalized = file.replaceAll('\\','/');
    const global = /\/governance\/|\/graph\/|\/entities\/domain-graph\.yml$|\/config\.yml$|\/package\.json$|\/runtime\/semantic-(graph|governor|impact)\.ts$|\/scripts\/semantic-impact\.ts$|\.github\/workflows\/commerce-example\.yml$/.test(normalized);
    if (global) {
      architectureNodes.forEach(node => seeds.add(node.id));
      continue;
    }
    for (const node of architectureNodes) {
      const slug = kebab(node.label);
      const folders: Record<string,string> = { Action:'actions',Actor:'actors',Agent:'agents',Tool:'tools',Flow:'flows',Intent:'intents',Entity:'entities' };
      const folder = folders[node.type];
      if (folder && normalized.includes(`/${folder}/${slug}`)) seeds.add(node.id);
      if (node.type === 'Entity' && normalized.endsWith(`/entities/${slug}.yml`)) seeds.add(node.id);
      if (node.type === 'Flow' && normalized.endsWith(`/flows/${slug}.2flow`)) seeds.add(node.id);
      if (node.type === 'Intent' && normalized.endsWith(`/intents/${slug}.yml`)) seeds.add(node.id);
      if (node.type === 'Event' && normalized.includes('/events/') && normalized.toLowerCase().includes(slug)) seeds.add(node.id);
    }
  }
  return [...seeds].sort();
}

export function analyzeSemanticImpact(graph: SemanticGraph, changedFiles: string[], maxDepth = 3): SemanticImpactReport {
  const seeds = mapChangedFilesToSeeds(graph, changedFiles);
  const impacted = new Set<string>(seeds);
  let frontier = [...seeds];
  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const next = new Set<string>();
    for (const current of frontier) {
      for (const edge of graph.edges) {
        if (['TESTED_BY','PRODUCES','MEASURES','PROVES','VIOLATES'].includes(edge.type)) continue;
        const neighbor = edge.from === current ? edge.to : edge.to === current ? edge.from : undefined;
        if (!neighbor || impacted.has(neighbor)) continue;
        const node = graph.nodes.find(candidate => candidate.id === neighbor);
        if (!node || !ARCH_TYPES.has(node.type)) continue;
        impacted.add(neighbor); next.add(neighbor);
      }
    }
    frontier = [...next];
  }

  const requiredTests = new Set<string>();
  for (const nodeId of impacted) {
    for (const edge of graph.edges) if (edge.type === 'TESTED_BY' && edge.from === nodeId) requiredTests.add(edge.to);
  }

  let score = 0;
  for (const id of impacted) {
    const node = graph.nodes.find(candidate => candidate.id === id);
    if (!node) continue;
    score += CRITICAL_TYPES.has(node.type) ? 8 : HIGH_TYPES.has(node.type) ? 5 : 2;
  }
  if (changedFiles.some(file => /governance|domain-graph\.yml|config\.yml|semantic-governor|semantic-impact|package\.json|commerce-example\.yml/.test(file))) score += 20;
  const risk = score >= 80 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 15 ? 'MEDIUM' : 'LOW';
  return { changed_files:[...changedFiles].sort(), seed_nodes:seeds, impacted_nodes:[...impacted].sort(), required_tests:[...requiredTests].sort(), risk, risk_score:score };
}
