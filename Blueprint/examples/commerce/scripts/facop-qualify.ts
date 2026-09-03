import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  FACOP_ACTION_CATEGORIES,
  actionResultPath,
  currentFacopEnvironment,
  discoverFacopActions,
  loadFacopConfig,
  validateFacopCategoryEvidence,
  type FacopActionEvidence,
  type FacopCategoryEvidence,
  type FacopEvidencePassport,
  type FacopEvidencePlan,
} from '../runtime/facop.js';

const root = join(import.meta.dirname, '..');
const repoRoot = join(root, '..', '..', '..');
const config = await loadFacopConfig(root);
const actions = await discoverFacopActions(root, config);
const plan = JSON.parse(await readFile(join(root, '.facop', 'plan.json'), 'utf8')) as FacopEvidencePlan;
if (plan.profile !== 'qualification') throw new Error(`Expected qualification plan, received ${plan.profile}`);

let previous: FacopEvidencePassport | undefined;
if (process.env.FACOP_PREVIOUS_PASSPORT) previous = JSON.parse(await readFile(process.env.FACOP_PREVIOUS_PASSPORT, 'utf8')) as FacopEvidencePassport;
const previousBySubject = new Map((previous?.actions ?? []).map(item => [item.subject, item]));
const errors: string[] = [];
const evidence: FacopActionEvidence[] = [];

for (const decision of plan.decisions.filter(item => item.decision !== 'not-selected')) {
  const action = actions.find(candidate => candidate.semantic_id === decision.subject);
  if (!action) { errors.push(`Unknown Action subject ${decision.subject}`); continue; }
  if (decision.decision === 'reuse') {
    const prior = previousBySubject.get(decision.subject);
    if (!prior || prior.evidence_key !== decision.evidence_key) {
      errors.push(`${decision.subject} was planned for reuse without exact prior EvidenceKey`);
      continue;
    }
    evidence.push({ ...prior, reused: true });
    continue;
  }

  const categories: FacopActionEvidence['categories'] = {};
  for (const category of FACOP_ACTION_CATEGORIES) {
    const mode = config.validation.action[category];
    if (!mode) continue;
    const path = actionResultPath(root, action, category);
    let raw: { status?: string; metrics?: unknown[]; metadata?: Record<string, unknown>; errors?: Array<{ message?: string }> };
    try { raw = JSON.parse(await readFile(path, 'utf8')) as typeof raw; }
    catch (error) { errors.push(`${decision.subject}/${category}: missing result ${String(error)}`); continue; }
    const status = raw.status === 'passed' ? 'passed' : raw.status === 'not-applicable' ? 'not-applicable' : 'failed';
    const reason = typeof raw.metadata?.not_applicable_reason === 'string'
      ? raw.metadata.not_applicable_reason
      : raw.errors?.[0]?.message;
    const item: FacopCategoryEvidence = {
      status,
      mode,
      result_file: `actions/${action.folder}/tests/${category}/result.json`,
      ...(reason ? { reason } : {}),
      ...(raw.metrics ? { metrics: raw.metrics } : {}),
    };
    categories[category] = item;
    errors.push(...validateFacopCategoryEvidence(category, mode, item).map(message => `${decision.subject}: ${message}`));
  }
  evidence.push({
    subject: decision.subject,
    action_name: decision.action_name,
    folder: decision.folder,
    evidence_key: decision.evidence_key,
    reused: false,
    categories,
  });
}

const required = plan.decisions.filter(item => item.decision !== 'not-selected').length;
const reused = evidence.filter(item => item.reused).length;
const executed = evidence.filter(item => !item.reused).length;
const missing = Math.max(0, required - evidence.length);
const invalid = errors.length;
if (missing) errors.push(`Evidence closure missing ${missing} Actions`);
if (errors.length) throw new Error(`FACoP qualification rejected:\n- ${errors.join('\n- ')}`);

function gitValue(args: string[], fallback: string): string {
  try { return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim(); }
  catch { return fallback; }
}

const passport: FacopEvidencePassport = {
  protocol: 'FACoP',
  version: config.version,
  generated_at: new Date().toISOString(),
  commit_sha: process.env.GITHUB_SHA ?? gitValue(['rev-parse', 'HEAD'], 'unknown'),
  tree_sha: gitValue(['rev-parse', 'HEAD^{tree}'], 'unknown'),
  environment: currentFacopEnvironment(),
  stage: {
    status: 'passed',
    evidence: [
      'Action unit contracts',
      'Project-owned integration tests',
      'Project-owned E2E product acceptance',
      'Dependency security audit',
      'Project-owned security hardening tests',
    ],
  },
  qualification: { required, executed, reused, missing, invalid },
  actions: evidence.sort((a, b) => a.subject.localeCompare(b.subject)),
};
await mkdir(join(root, '.facop', 'evidence'), { recursive: true });
await mkdir(join(root, 'tests', 'dashboard'), { recursive: true });
await writeFile(join(root, '.facop', 'evidence', 'passport.json'), `${JSON.stringify(passport, null, 2)}\n`, 'utf8');
await writeFile(join(root, 'tests', 'dashboard', 'facop-passport.json'), `${JSON.stringify(passport, null, 2)}\n`, 'utf8');
console.log(`QUALIFIED ${passport.commit_sha} tree=${passport.tree_sha}: required=${required} executed=${executed} reused=${reused}.`);
