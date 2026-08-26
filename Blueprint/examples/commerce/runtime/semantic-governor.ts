import type { SemanticGraph } from './semantic-graph.js';

function nodesOf(graph: SemanticGraph, type: string) {
  return graph.nodes.filter(node => (node.type as string) === type);
}

function incoming(graph: SemanticGraph, to: string, type: string) {
  return graph.edges.filter(edge => edge.to === to && edge.type === type);
}

function outgoing(graph: SemanticGraph, from: string, type: string) {
  return graph.edges.filter(edge => edge.from === from && edge.type === type);
}

export interface GovernorDecision {
  allowed: boolean;
  errors: string[];
}

export function governSemanticGraph(graph: SemanticGraph): GovernorDecision {
  const errors: string[] = [];

  for (const agent of nodesOf(graph, 'Agent')) {
    const contexts = outgoing(graph, agent.id, 'BOUND_TO');
    if (contexts.length !== 1) errors.push(`${agent.id} must be BOUND_TO exactly one Context, found ${contexts.length}`);
  }

  for (const action of nodesOf(graph, 'Action')) {
    const capabilities = outgoing(graph, action.id, 'REQUIRES');
    if (capabilities.length === 0) errors.push(`${action.id} requires no Capability`);
    const policies = outgoing(graph, action.id, 'GOVERNED_BY');
    if (policies.length === 0) errors.push(`${action.id} is governed by no Policy`);

    const emitted = [
      ...outgoing(graph, action.id, 'EMITS_OK'),
      ...outgoing(graph, action.id, 'EMITS_ERROR'),
    ];
    for (const edge of emitted) {
      if (outgoing(graph, edge.to, 'VALIDATED_BY').length === 0) {
        errors.push(`${edge.to} emitted by ${action.id} has no VALIDATED_BY Schema`);
      }
    }
  }

  for (const capability of nodesOf(graph, 'Capability')) {
    const required = incoming(graph, capability.id, 'REQUIRES');
    const implementations = incoming(graph, capability.id, 'IMPLEMENTS');
    if (required.length > 0 && implementations.length === 0) {
      errors.push(`${capability.id} is required but has no implementation`);
    }
  }

  for (const invariant of nodesOf(graph, 'Invariant')) {
    const guardedEntities = incoming(graph, invariant.id, 'GUARDED_BY');
    if (guardedEntities.length === 0) errors.push(`${invariant.id} guards no Entity`);
    const preservers = incoming(graph, invariant.id, 'PRESERVES');
    if (preservers.length === 0) errors.push(`${invariant.id} is preserved by no Action`);
  }

  for (const constraint of nodesOf(graph, 'Constraint')) {
    if (incoming(graph, constraint.id, 'CONSTRAINED_BY').length === 0) errors.push(`${constraint.id} constrains no Action`);
    if (outgoing(graph, constraint.id, 'PROTECTS').length === 0) errors.push(`${constraint.id} protects no Invariant`);
  }

  for (const flow of nodesOf(graph, 'Flow')) {
    if (outgoing(graph, flow.id, 'PRESERVES_LAW').length === 0) errors.push(`${flow.id} preserves no Law`);
  }

  for (const entity of nodesOf(graph, 'Entity')) {
    if (outgoing(graph, entity.id, 'HAS_PROPERTY').length === 0) errors.push(`${entity.id} has no Property nodes`);
  }

  return { allowed: errors.length === 0, errors };
}

export function assertSemanticGovernor(graph: SemanticGraph): void {
  const decision = governSemanticGraph(graph);
  if (!decision.allowed) throw new Error(`Semantic Governor rejected startup:\n- ${decision.errors.join('\n- ')}`);
}
