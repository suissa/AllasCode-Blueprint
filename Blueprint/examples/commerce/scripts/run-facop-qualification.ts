import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FacopEvidencePlan } from '../runtime/facop.js';

const root = join(import.meta.dirname, '..');
const plan = JSON.parse(await readFile(join(root, '.facop', 'plan.json'), 'utf8')) as FacopEvidencePlan;
if (plan.profile !== 'qualification') throw new Error(`Expected qualification plan, received ${plan.profile}`);
const execute = plan.decisions.filter(item => item.decision === 'execute');
if (!execute.length) {
  console.log('FACoP qualification: every Action EvidenceKey is reusable; no Action characterization executed.');
  process.exit(0);
}
const files = execute.map(item => `actions/${item.folder}/tests/action.test.ts`).sort();
console.log(`FACoP qualification executing ${files.length} invalidated Action evidence suites.`);
execFileSync('npx', ['tsx', '--test', ...files], { cwd: root, stdio: 'inherit', env: process.env });
