import test from 'node:test';
import assert from 'node:assert/strict';
import {assertTaggable,evaluateFinalRelease,type ReleaseGateInput} from '../release/final-release-gate.js';

const green:ReleaseGateInput={version:'v1.0.0',approved_commit:'a'.repeat(40),release_blocking_issues_open:0,branch_protection:true,semantic_merge_gate:true,evidence_fresh:true,semantic_coverage_pass:true,mutation_score_pass:true,selector_confidence_100:true,security_pass:true,performance_pass:true,backup_restore_pass:true,e2e_pass:true,staging_pilot_pass:true,real_operator_pass:true,critical_or_high_defects_open:0,changelog_prepared:true,release_notes_prepared:true,deployment_reproducible:true};

test('all release evidence green allows exactly v1.0.0 from the approved commit',()=>{const r=assertTaggable(green);assert.equal(r.allowed,true);assert.equal(r.tag,'v1.0.0');assert.equal(r.commit,'a'.repeat(40));});
test('real pilot and operator acceptance cannot be replaced by automated evidence',()=>{const r=evaluateFinalRelease({...green,staging_pilot_pass:false,real_operator_pass:false});assert.equal(r.allowed,false);assert.deepEqual(r.blockers.filter(x=>x.includes('pilot')||x.includes('operator')),['staging-pilot-not-approved','real-operator-not-approved']);});
test('branch protection and semantic evidence are mandatory',()=>{const r=evaluateFinalRelease({...green,branch_protection:false,semantic_merge_gate:false,evidence_fresh:false});assert.equal(r.allowed,false);for(const blocker of ['branch-protection-not-enforced','semantic-merge-gate-not-allow','semantic-evidence-stale'])assert.ok(r.blockers.includes(blocker));});
test('critical or high defects and open release blockers prevent tagging',()=>{const r=evaluateFinalRelease({...green,release_blocking_issues_open:2,critical_or_high_defects_open:1});assert.equal(r.allowed,false);assert.ok(r.blockers.includes('release-blocking-issues-open'));assert.ok(r.blockers.includes('critical-or-high-defects-open'));});
test('tagging rejects an unapproved commit or different version',()=>{assert.throws(()=>assertTaggable({...green,version:'v1.0.1',approved_commit:'not-a-sha'}),/ReleaseBlocked/);});
