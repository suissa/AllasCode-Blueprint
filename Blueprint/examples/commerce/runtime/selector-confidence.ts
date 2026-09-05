import type { SemanticGraph } from './semantic-graph.js';
import { analyzeSemanticImpact, mapChangedFilesToSeeds } from './semantic-impact.js';
import { buildSelectiveTestPlan } from './selective-semantic-tests.js';

export interface SelectorScenario {
  name: string;
  changed_files: string[];
}

export interface SelectorScenarioResult {
  name: string;
  changed_files: string[];
  oracle_tests: string[];
  selected_tests: string[];
  missed_tests: string[];
  recall_percent: number;
}

export interface SelectorConfidenceReport {
  scenarios: SelectorScenarioResult[];
  oracle_tests_total: number;
  oracle_tests_covered: number;
  recall_percent: number;
  confidence_percent: number;
  passed: boolean;
}

const EVIDENCE_EDGES = new Set(['TESTED_BY','PRODUCES','MEASURES','PROVES','VIOLATES']);

function directOracleTests(graph: SemanticGraph, changedFiles: string[]): string[] {
  const seeds = new Set(mapChangedFilesToSeeds(graph, changedFiles));
  const oracleNodes = new Set<string>(seeds);

  for (const edge of graph.edges) {
    if (EVIDENCE_EDGES.has(edge.type)) continue;
    if (seeds.has(edge.from)) oracleNodes.add(edge.to);
    if (seeds.has(edge.to)) oracleNodes.add(edge.from);
  }

  const tests = new Set<string>();
  for (const node of oracleNodes) {
    for (const edge of graph.edges) {
      if (edge.type === 'TESTED_BY' && edge.from === node) tests.add(edge.to);
    }
  }
  return [...tests].sort();
}

export function defaultSelectorScenarios(): SelectorScenario[] {
  return [
    { name:'action-mutation', changed_files:['Blueprint/examples/commerce/actions/decrease-stock/implementation/index.ts'] },
    { name:'agent-mutation', changed_files:['Blueprint/examples/commerce/agents/inventory-agent/manifest.yml'] },
    { name:'actor-mutation', changed_files:['Blueprint/examples/commerce/actors/inventory-actor/manifest.yml'] },
    { name:'flow-mutation', changed_files:['Blueprint/examples/commerce/flows/process-sale.2flow'] },
    { name:'intent-mutation', changed_files:['Blueprint/examples/commerce/intents/process-sale.yml'] },
    { name:'entity-mutation', changed_files:['Blueprint/examples/commerce/entities/stock/properties.yml'] },
    { name:'governance-mutation', changed_files:['Blueprint/examples/commerce/governance/catalog.yml'] },
    { name:'graph-contract-mutation', changed_files:['Blueprint/examples/commerce/graph/schema.yml'] },
  ];
}

export function computeSelectorConfidence(graph: SemanticGraph, scenarios = defaultSelectorScenarios()): SelectorConfidenceReport {
  const results: SelectorScenarioResult[] = [];
  let total = 0;
  let covered = 0;

  for (const scenario of scenarios) {
    const impact = analyzeSemanticImpact(graph, scenario.changed_files);
    const plan = buildSelectiveTestPlan(graph, impact.required_tests);
    const selected = new Set(plan.required_tests);
    const oracle = directOracleTests(graph, scenario.changed_files);
    const missed = oracle.filter(test => !selected.has(test));
    total += oracle.length;
    covered += oracle.length - missed.length;
    results.push({
      name:scenario.name,
      changed_files:scenario.changed_files,
      oracle_tests:oracle,
      selected_tests:plan.required_tests,
      missed_tests:missed,
      recall_percent: oracle.length === 0 ? 100 : ((oracle.length - missed.length) / oracle.length) * 100,
    });
  }

  const recall = total === 0 ? 100 : (covered / total) * 100;
  return {
    scenarios:results,
    oracle_tests_total:total,
    oracle_tests_covered:covered,
    recall_percent:recall,
    confidence_percent:recall,
    passed:recall === 100 && results.every(result => result.missed_tests.length === 0),
  };
}
