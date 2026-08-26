import type { SemanticGraph } from './semantic-graph.js';

function nodesOf(graph: SemanticGraph, type: string) { return graph.nodes.filter(node => (node.type as string) === type); }
function incoming(graph: SemanticGraph, to: string, type: string) { return graph.edges.filter(edge => edge.to === to && edge.type === type); }
function outgoing(graph: SemanticGraph, from: string, type: string) { return graph.edges.filter(edge => edge.from === from && edge.type === type); }
function targets(graph: SemanticGraph, from: string, type: string): Set<string> { return new Set(outgoing(graph, from, type).map(edge => edge.to)); }
function sameSet(a: Set<string>, b: Set<string>): boolean { return a.size === b.size && [...a].every(value => b.has(value)); }
function superset(candidate: Set<string>, required: Set<string>): boolean { return [...required].every(value => candidate.has(value)); }

export interface GovernorDecision { allowed: boolean; errors: string[]; }

function validateAlternative(graph: SemanticGraph, source: string, target: string): string[] {
  const errors: string[] = [];
  if (!graph.nodes.some(node => node.id === source && node.type === 'Action')) errors.push(`${source} is not an Action`);
  if (!graph.nodes.some(node => node.id === target && node.type === 'Action')) errors.push(`${target} is not an Action`);
  const sourceOwner = outgoing(graph, source, 'ACTION_OWNER')[0]?.to;
  const targetOwner = outgoing(graph, target, 'ACTION_OWNER')[0]?.to;
  if (!sourceOwner || sourceOwner !== targetOwner) errors.push(`${target} cannot substitute ${source}: owner/context differs`);
  if (!sameSet(targets(graph, source, 'EMITS_OK'), targets(graph, target, 'EMITS_OK'))) errors.push(`${target} cannot substitute ${source}: Ok contract differs`);
  if (!sameSet(targets(graph, source, 'EMITS_ERROR'), targets(graph, target, 'EMITS_ERROR'))) errors.push(`${target} cannot substitute ${source}: Error contract differs`);
  if (!sameSet(targets(graph, source, 'REQUIRES'), targets(graph, target, 'REQUIRES'))) errors.push(`${target} cannot substitute ${source}: Capability requirements differ`);
  if (!superset(targets(graph, target, 'GOVERNED_BY'), targets(graph, source, 'GOVERNED_BY'))) errors.push(`${target} cannot substitute ${source}: Policies are not a superset`);
  if (!superset(targets(graph, target, 'PRESERVES'), targets(graph, source, 'PRESERVES'))) errors.push(`${target} cannot substitute ${source}: Invariants are not a superset`);
  if (!superset(targets(graph, target, 'CONSTRAINED_BY'), targets(graph, source, 'CONSTRAINED_BY'))) errors.push(`${target} cannot substitute ${source}: Constraints are not a superset`);
  return errors;
}

function validateTestEvidence(graph: SemanticGraph): string[] {
  const errors: string[] = [];
  const governanceTypes = new Set(['Invariant','Policy','Law']);

  for (const test of nodesOf(graph, 'Test')) {
    if (incoming(graph, test.id, 'TESTED_BY').length !== 1) errors.push(`${test.id} must be referenced by exactly one TESTED_BY edge`);
    if (outgoing(graph, test.id, 'PRODUCES').length !== 1) errors.push(`${test.id} must PRODUCE exactly one TestResult`);
  }

  for (const result of nodesOf(graph, 'TestResult')) {
    const producer = incoming(graph, result.id, 'PRODUCES');
    if (producer.length !== 1) errors.push(`${result.id} must have exactly one PRODUCES source`);
    for (const edge of [...outgoing(graph, result.id, 'PROVES'), ...outgoing(graph, result.id, 'VIOLATES')]) {
      const target = graph.nodes.find(node => node.id === edge.to);
      if (!target || !governanceTypes.has(String(target.type))) errors.push(`${edge.id} must target Invariant, Policy or Law`);
    }
    for (const edge of outgoing(graph, result.id, 'MEASURES')) {
      const target = graph.nodes.find(node => node.id === edge.to);
      if (!target || target.type !== 'Metric') errors.push(`${edge.id} must target Metric`);
    }
  }

  for (const metric of nodesOf(graph, 'Metric')) {
    if (incoming(graph, metric.id, 'MEASURES').length === 0) errors.push(`${metric.id} is not measured by any TestResult`);
  }
  return errors;
}

export function governSemanticGraph(graph: SemanticGraph): GovernorDecision {
  const errors: string[] = [];
  for (const agent of nodesOf(graph, 'Agent')) {
    const contexts = outgoing(graph, agent.id, 'BOUND_TO');
    if (contexts.length !== 1) errors.push(`${agent.id} must be BOUND_TO exactly one Context, found ${contexts.length}`);
  }
  for (const action of nodesOf(graph, 'Action')) {
    if (outgoing(graph, action.id, 'REQUIRES').length === 0) errors.push(`${action.id} requires no Capability`);
    if (outgoing(graph, action.id, 'GOVERNED_BY').length === 0) errors.push(`${action.id} is governed by no Policy`);
    for (const edge of [...outgoing(graph, action.id, 'EMITS_OK'), ...outgoing(graph, action.id, 'EMITS_ERROR')]) {
      if (outgoing(graph, edge.to, 'VALIDATED_BY').length === 0) errors.push(`${edge.to} emitted by ${action.id} has no VALIDATED_BY Schema`);
    }
  }
  for (const capability of nodesOf(graph, 'Capability')) {
    if (incoming(graph, capability.id, 'REQUIRES').length > 0 && incoming(graph, capability.id, 'IMPLEMENTS').length === 0) errors.push(`${capability.id} is required but has no implementation`);
  }
  for (const invariant of nodesOf(graph, 'Invariant')) {
    if (incoming(graph, invariant.id, 'GUARDED_BY').length === 0) errors.push(`${invariant.id} guards no Entity`);
    if (incoming(graph, invariant.id, 'PRESERVES').length === 0) errors.push(`${invariant.id} is preserved by no Action`);
  }
  for (const constraint of nodesOf(graph, 'Constraint')) {
    if (incoming(graph, constraint.id, 'CONSTRAINED_BY').length === 0) errors.push(`${constraint.id} constrains no Action`);
    if (outgoing(graph, constraint.id, 'PROTECTS').length === 0) errors.push(`${constraint.id} protects no Invariant`);
  }
  for (const flow of nodesOf(graph, 'Flow')) if (outgoing(graph, flow.id, 'PRESERVES_LAW').length === 0) errors.push(`${flow.id} preserves no Law`);
  for (const entity of nodesOf(graph, 'Entity')) if (outgoing(graph, entity.id, 'HAS_PROPERTY').length === 0) errors.push(`${entity.id} has no Property nodes`);

  for (const edge of graph.edges.filter(edge => ['SUBSTITUTABLE_BY', 'FALLBACK_TO'].includes(edge.type))) {
    errors.push(...validateAlternative(graph, edge.from, edge.to));
    if (!graph.edges.some(candidate => candidate.type === 'SEMANTICALLY_EQUIVALENT_TO' && candidate.from === edge.from && candidate.to === edge.to)) errors.push(`${edge.id} requires explicit SEMANTICALLY_EQUIVALENT_TO`);
  }

  errors.push(...validateTestEvidence(graph));
  return { allowed: errors.length === 0, errors };
}

export function assertSemanticGovernor(graph: SemanticGraph): void {
  const decision = governSemanticGraph(graph);
  if (!decision.allowed) throw new Error(`Semantic Governor rejected startup:\n- ${decision.errors.join('\n- ')}`);
}
