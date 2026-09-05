export type ReleaseEvidence = {
  branch_protection: boolean;
  semantic_merge_gate: 'ALLOW'|'REVIEW'|'BLOCK';
  semantic_evidence_fresh: boolean;
  coverage_passed: boolean;
  mutation_passed: boolean;
  security_passed: boolean;
  load_stress_passed: boolean;
  backup_restore_passed: boolean;
  e2e_passed: boolean;
  staging_pilot_passed: boolean;
  operator_acceptance_passed: boolean;
  reproducible_deployment: boolean;
  blocking_defects: Array<{severity:'critical'|'high'|'medium'|'low';id:string}>;
  open_release_blocking_issues: number[];
};

export type ReleaseGateResult = {
  ready: boolean;
  blockers: string[];
  version: 'v1.0.0';
};

export function evaluateFinalRelease(e: ReleaseEvidence): ReleaseGateResult {
  const blockers:string[]=[];
  if (!e.branch_protection) blockers.push('branch-protection');
  if (e.semantic_merge_gate !== 'ALLOW') blockers.push(`semantic-merge-gate:${e.semantic_merge_gate}`);
  if (!e.semantic_evidence_fresh) blockers.push('semantic-evidence-stale');
  if (!e.coverage_passed) blockers.push('coverage');
  if (!e.mutation_passed) blockers.push('mutation');
  if (!e.security_passed) blockers.push('security');
  if (!e.load_stress_passed) blockers.push('load-stress');
  if (!e.backup_restore_passed) blockers.push('backup-restore');
  if (!e.e2e_passed) blockers.push('e2e');
  if (!e.staging_pilot_passed) blockers.push('staging-pilot');
  if (!e.operator_acceptance_passed) blockers.push('operator-acceptance');
  if (!e.reproducible_deployment) blockers.push('deployment-reproducibility');
  if (e.blocking_defects.some(d=>d.severity==='critical'||d.severity==='high')) blockers.push('blocking-defects');
  if (e.open_release_blocking_issues.length) blockers.push(`open-issues:${e.open_release_blocking_issues.join(',')}`);
  return {ready:blockers.length===0,blockers,version:'v1.0.0'};
}

export function assertReleaseReady(e: ReleaseEvidence): ReleaseGateResult {
  const result=evaluateFinalRelease(e);
  if (!result.ready) throw new Error(`ReleaseBlocked:${result.blockers.join('|')}`);
  return result;
}
