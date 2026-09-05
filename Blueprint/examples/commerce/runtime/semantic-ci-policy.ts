export type Risk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SemanticCiPolicyInput {
  risk: Risk;
  confidence_percent: number;
  missed_tests: number;
  unmapped_tests: number;
  global_impact: boolean;
}

export interface SemanticCiPolicyDecision {
  mode: 'selective' | 'full';
  run_full_actions: boolean;
  run_full_architecture: boolean;
  reason: string;
}

export function decideSemanticCiPolicy(input: SemanticCiPolicyInput): SemanticCiPolicyDecision {
  if (input.risk === 'HIGH' || input.risk === 'CRITICAL') {
    return { mode: 'full', run_full_actions: true, run_full_architecture: true, reason: `Risk ${input.risk} requires full semantic suites.` };
  }
  if (input.global_impact) {
    return { mode: 'full', run_full_actions: true, run_full_architecture: true, reason: 'Global semantic impact requires full semantic suites.' };
  }
  if (input.confidence_percent !== 100 || input.missed_tests !== 0) {
    return { mode: 'full', run_full_actions: true, run_full_architecture: true, reason: 'Selector confidence is below the 100% recall gate.' };
  }
  if (input.unmapped_tests !== 0) {
    return { mode: 'full', run_full_actions: true, run_full_architecture: true, reason: 'Selective test plan contains unmapped tests.' };
  }
  return { mode: 'selective', run_full_actions: false, run_full_architecture: false, reason: `Risk ${input.risk}, confidence 100%, and complete mapping permit selective-only execution.` };
}
