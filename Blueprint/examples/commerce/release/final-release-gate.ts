export type ReleaseGateInput={
  version:string;
  approved_commit:string;
  release_blocking_issues_open:number;
  branch_protection:boolean;
  semantic_merge_gate:boolean;
  evidence_fresh:boolean;
  semantic_coverage_pass:boolean;
  mutation_score_pass:boolean;
  selector_confidence_100:boolean;
  security_pass:boolean;
  performance_pass:boolean;
  backup_restore_pass:boolean;
  e2e_pass:boolean;
  staging_pilot_pass:boolean;
  real_operator_pass:boolean;
  critical_or_high_defects_open:number;
  changelog_prepared:boolean;
  release_notes_prepared:boolean;
  deployment_reproducible:boolean;
};

export type ReleaseGateResult={allowed:boolean;blockers:string[];tag:string;commit:string};

export function evaluateFinalRelease(input:ReleaseGateInput):ReleaseGateResult{
  const blockers:string[]=[];
  if(input.version!=='v1.0.0')blockers.push('version-not-v1.0.0');
  if(!/^[0-9a-f]{40}$/i.test(input.approved_commit))blockers.push('approved-commit-required');
  if(input.release_blocking_issues_open!==0)blockers.push('release-blocking-issues-open');
  if(!input.branch_protection)blockers.push('branch-protection-not-enforced');
  if(!input.semantic_merge_gate)blockers.push('semantic-merge-gate-not-allow');
  if(!input.evidence_fresh)blockers.push('semantic-evidence-stale');
  if(!input.semantic_coverage_pass)blockers.push('semantic-coverage-failed');
  if(!input.mutation_score_pass)blockers.push('mutation-score-failed');
  if(!input.selector_confidence_100)blockers.push('selector-confidence-below-100');
  if(!input.security_pass)blockers.push('security-acceptance-failed');
  if(!input.performance_pass)blockers.push('performance-acceptance-failed');
  if(!input.backup_restore_pass)blockers.push('backup-restore-acceptance-failed');
  if(!input.e2e_pass)blockers.push('e2e-acceptance-failed');
  if(!input.staging_pilot_pass)blockers.push('staging-pilot-not-approved');
  if(!input.real_operator_pass)blockers.push('real-operator-not-approved');
  if(input.critical_or_high_defects_open!==0)blockers.push('critical-or-high-defects-open');
  if(!input.changelog_prepared)blockers.push('changelog-not-prepared');
  if(!input.release_notes_prepared)blockers.push('release-notes-not-prepared');
  if(!input.deployment_reproducible)blockers.push('deployment-not-reproducible');
  return{allowed:blockers.length===0,blockers,tag:input.version,commit:input.approved_commit};
}

export function assertTaggable(input:ReleaseGateInput):ReleaseGateResult{
  const result=evaluateFinalRelease(input);
  if(!result.allowed)throw new Error(`ReleaseBlocked:${result.blockers.join(',')}`);
  return result;
}
