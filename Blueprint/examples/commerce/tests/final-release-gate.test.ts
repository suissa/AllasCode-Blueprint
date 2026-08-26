import assert from 'node:assert/strict';
import test from 'node:test';
import { assertReleaseReady, evaluateFinalRelease, type ReleaseEvidence } from '../release/final-release-gate.js';

const green=():ReleaseEvidence=>({
  branch_protection:true,
  semantic_merge_gate:'ALLOW',
  semantic_evidence_fresh:true,
  coverage_passed:true,
  mutation_passed:true,
  security_passed:true,
  load_stress_passed:true,
  backup_restore_passed:true,
  e2e_passed:true,
  staging_pilot_passed:true,
  operator_acceptance_passed:true,
  reproducible_deployment:true,
  blocking_defects:[],
  open_release_blocking_issues:[]
});

test('blocks v1 while external acceptance and repository protection are incomplete',()=>{
  const evidence=green();
  evidence.branch_protection=false;
  evidence.staging_pilot_passed=false;
  evidence.operator_acceptance_passed=false;
  evidence.open_release_blocking_issues=[23,64,65];
  const result=evaluateFinalRelease(evidence);
  assert.equal(result.ready,false);
  assert.deepEqual(result.blockers,['branch-protection','staging-pilot','operator-acceptance','open-issues:23,64,65']);
  assert.throws(()=>assertReleaseReady(evidence),/ReleaseBlocked/);
});

test('critical and high defects block release, medium defects do not automatically block',()=>{
  const critical=green();critical.blocking_defects=[{severity:'high',id:'bug-1'}];
  assert.equal(evaluateFinalRelease(critical).ready,false);
  const medium=green();medium.blocking_defects=[{severity:'medium',id:'bug-2'}];
  assert.equal(evaluateFinalRelease(medium).ready,true);
});

test('approves exactly v1.0.0 only when all release evidence is green',()=>{
  assert.deepEqual(assertReleaseReady(green()),{ready:true,blockers:[],version:'v1.0.0'});
});
