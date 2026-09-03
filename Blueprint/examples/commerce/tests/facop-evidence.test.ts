import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  compileFacopEvidencePlan,
  computeFacopEvidenceKey,
  validateFacopCategoryEvidence,
  type FacopEvidencePassport,
  type FacopProjectConfig,
} from '../runtime/facop.js';
import type { SemanticGraph } from '../runtime/semantic-graph.js';
import type { SemanticImpactReport } from '../runtime/semantic-impact.js';

const config: FacopProjectConfig = {
  version: '0.1.0',
  protocol: 'FACoP',
  subjects: { actions_root: './actions', identity: 'semantic_id' },
  evidence: { algorithm: 'sha256', shared_inputs: ['./config.yml'] },
  validation: {
    action: { unit: 'required', benchmark: 'characterize', load: 'characterize', stress: 'characterize', chaos: 'characterize' },
    system: { integration: 'required', e2e: 'required', security: 'required' },
  },
  profiles: {
    local: { trust: 'contributor', purpose: 'local' },
    dev: { trust: 'contributor', purpose: 'dev' },
    stage: { trust: 'upstream', purpose: 'stage' },
    qualification: { trust: 'upstream', purpose: 'qualification' },
    upstream: { trust: 'upstream', purpose: 'upstream' },
  },
};

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'allascode-facop-'));
  const actionPath = join(root, 'actions', 'sample-action');
  await mkdir(join(actionPath, 'implementation'), { recursive: true });
  await mkdir(join(actionPath, 'tests'), { recursive: true });
  await writeFile(join(root, 'config.yml'), 'system: sample\n');
  await writeFile(join(actionPath, 'README.md'), '# Sample\n');
  await writeFile(join(actionPath, 'manifest.yml'), 'name: SampleAction\nsemantic_id: sample.action\n');
  await writeFile(join(actionPath, 'config.yml'), 'enabled: true\n');
  await writeFile(join(actionPath, 'implementation', 'implementation.ts'), 'export const value = 1;\n');
  await writeFile(join(actionPath, 'tests', 'action.test.ts'), 'export const test = 1;\n');
  return { root, action: { name: 'SampleAction', semantic_id: 'sample.action', folder: 'sample-action', path: actionPath } };
}

const graph: SemanticGraph = {
  version: '0.1.0',
  nodes: [{ id: 'Action:SampleAction', type: 'Action', label: 'SampleAction', semantic_id: 'sample.action' }],
  edges: [],
};
const impact: SemanticImpactReport = {
  changed_files: ['Blueprint/examples/commerce/actions/sample-action/implementation/implementation.ts'],
  seed_nodes: ['Action:SampleAction'],
  impacted_nodes: ['Action:SampleAction'],
  required_tests: [],
  risk: 'LOW',
  risk_score: 5,
};

test('EvidenceKey is content addressed and changes when semantic inputs change', async () => {
  const { root, action } = await fixture();
  try {
    const environment = { node: 'v24.0.0', platform: 'linux', arch: 'x64' };
    const first = await computeFacopEvidenceKey(root, action, config, environment);
    const second = await computeFacopEvidenceKey(root, action, config, environment);
    assert.equal(first, second);
    await writeFile(join(action.path, 'implementation', 'implementation.ts'), 'export const value = 2;\n');
    const changed = await computeFacopEvidenceKey(root, action, config, environment);
    assert.notEqual(first, changed);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('qualification reuses only exact EvidenceKeys', async () => {
  const { root, action } = await fixture();
  try {
    const environment = { node: 'v24.0.0', platform: 'linux', arch: 'x64' };
    const key = await computeFacopEvidenceKey(root, action, config, environment);
    const previous: FacopEvidencePassport = {
      protocol: 'FACoP', version: '0.1.0', generated_at: new Date().toISOString(), commit_sha: 'a', tree_sha: 'b', environment,
      stage: { status: 'passed', evidence: [] }, qualification: { required: 1, executed: 1, reused: 0, missing: 0, invalid: 0 },
      actions: [{ subject: action.semantic_id, action_name: action.name, folder: action.folder, evidence_key: key, reused: false, categories: {} }],
    };
    const plan = compileFacopEvidencePlan({ config, graph, impact, profile: 'qualification', actions: [action], keys: new Map([[action.semantic_id, key]]), previous, environment });
    assert.equal(plan.decisions[0]?.decision, 'reuse');
    const changedPlan = compileFacopEvidencePlan({ config, graph, impact, profile: 'qualification', actions: [action], keys: new Map([[action.semantic_id, `${key}-changed`]]), previous, environment });
    assert.equal(changedPlan.decisions[0]?.decision, 'execute');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('dev selects impacted Action while stage owns system acceptance', () => {
  const action = { name: 'SampleAction', semantic_id: 'sample.action', folder: 'sample-action', path: '/tmp/sample' };
  const keys = new Map([[action.semantic_id, 'sha256:key']]);
  const dev = compileFacopEvidencePlan({ config, graph, impact, profile: 'dev', actions: [action], keys });
  const stage = compileFacopEvidencePlan({ config, graph, impact, profile: 'stage', actions: [action], keys });
  assert.equal(dev.summary.execute, 1);
  assert.equal(stage.summary.selected, 0);
  assert.equal(config.profiles.dev.trust, 'contributor');
  assert.equal(config.profiles.stage.trust, 'upstream');
});

test('not-applicable evidence requires an explicit reason and cannot satisfy required evidence', () => {
  assert.deepEqual(validateFacopCategoryEvidence('chaos', 'characterize', { status: 'not-applicable', mode: 'characterize', reason: 'pure deterministic behavior' }), []);
  assert.ok(validateFacopCategoryEvidence('chaos', 'characterize', { status: 'not-applicable', mode: 'characterize' }).length > 0);
  assert.ok(validateFacopCategoryEvidence('unit', 'required', { status: 'not-applicable', mode: 'required', reason: 'invalid exemption' }).length > 0);
});
