import type { SemanticGraph } from './semantic-graph.js';

export interface SelectiveTestPlan {
  required_tests: string[];
  action_tests: string[];
  architecture_tests: string[];
  unmapped_tests: string[];
}

export function buildSelectiveTestPlan(graph: SemanticGraph, requiredTests: string[]): SelectiveTestPlan {
  const actionTests: string[] = [];
  const architectureTests: string[] = [];
  const unmapped: string[] = [];

  for (const testId of [...new Set(requiredTests)].sort()) {
    const testedBy = graph.edges.find(edge => edge.type === 'TESTED_BY' && edge.to === testId);
    if (!testedBy) { unmapped.push(testId); continue; }
    const artifact = graph.nodes.find(node => node.id === testedBy.from);
    if (!artifact) { unmapped.push(testId); continue; }
    if (artifact.type === 'Action') actionTests.push(testId);
    else architectureTests.push(testId);
  }

  return { required_tests:[...new Set(requiredTests)].sort(), action_tests:actionTests, architecture_tests:architectureTests, unmapped_tests:unmapped };
}
