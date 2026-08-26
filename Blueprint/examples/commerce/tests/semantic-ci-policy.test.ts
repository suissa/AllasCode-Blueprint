import test from 'node:test';
import assert from 'node:assert/strict';
import { decideSemanticCiPolicy } from '../runtime/semantic-ci-policy.js';

test('LOW risk with perfect confidence uses selective-only execution', () => {
  const decision = decideSemanticCiPolicy({ risk:'LOW', confidence_percent:100, missed_tests:0, unmapped_tests:0, global_impact:false });
  assert.equal(decision.mode, 'selective');
  assert.equal(decision.run_full_actions, false);
  assert.equal(decision.run_full_architecture, false);
});

test('MEDIUM risk with perfect confidence uses selective-only execution', () => {
  assert.equal(decideSemanticCiPolicy({ risk:'MEDIUM', confidence_percent:100, missed_tests:0, unmapped_tests:0, global_impact:false }).mode, 'selective');
});

test('HIGH and CRITICAL risk always require full suites', () => {
  assert.equal(decideSemanticCiPolicy({ risk:'HIGH', confidence_percent:100, missed_tests:0, unmapped_tests:0, global_impact:false }).mode, 'full');
  assert.equal(decideSemanticCiPolicy({ risk:'CRITICAL', confidence_percent:100, missed_tests:0, unmapped_tests:0, global_impact:false }).mode, 'full');
});

test('confidence loss, unmapped tests, or global impact forces full suites', () => {
  assert.equal(decideSemanticCiPolicy({ risk:'LOW', confidence_percent:99.9, missed_tests:1, unmapped_tests:0, global_impact:false }).mode, 'full');
  assert.equal(decideSemanticCiPolicy({ risk:'LOW', confidence_percent:100, missed_tests:0, unmapped_tests:1, global_impact:false }).mode, 'full');
  assert.equal(decideSemanticCiPolicy({ risk:'LOW', confidence_percent:100, missed_tests:0, unmapped_tests:0, global_impact:true }).mode, 'full');
});
