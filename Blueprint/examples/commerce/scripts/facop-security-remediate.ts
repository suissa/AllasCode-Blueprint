import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const securityDir = join(root, '.facop', 'security');
const intelligence = JSON.parse(await readFile(join(securityDir, 'intelligence.json'), 'utf8')) as { new_advisory_ids?: string[]; finding_count?: number };
const newIds = intelligence.new_advisory_ids ?? [];
if (!newIds.length) {
  console.log('FACoP security remediation: no new correlated advisories.');
  process.exit(0);
}

const command = process.env.FACOP_AI_REMEDIATOR_CMD?.trim();
if (!command) {
  console.log(`FACoP security remediation prompt generated for ${newIds.length} new advisory IDs. Set FACOP_AI_REMEDIATOR_CMD on the self-hosted server to enable the human-free local agent adapter.`);
  process.exit(0);
}

const promptPath = join(securityDir, 'remediation-prompt.md');
console.log(`FACoP local AI remediation adapter starting for: ${newIds.join(', ')}`);
const result = spawnSync(command, {
  cwd: root,
  shell: true,
  stdio: 'inherit',
  env: {
    ...process.env,
    FACOP_SECURITY_PROMPT: promptPath,
    FACOP_SECURITY_INTELLIGENCE: join(securityDir, 'intelligence.json'),
    FACOP_REQUIRED_REGRESSION_TEST: 'true',
  },
});
if (result.status !== 0) throw new Error(`Local AI remediation command failed with status ${result.status ?? 'unknown'}`);

const changed = spawnSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' });
const files = String(changed.stdout ?? '').split(/\r?\n/).map(value => value.trim()).filter(Boolean);
const hasTest = files.some(file => /(^|\/)(tests?|__tests__)\/|\.test\.|\.spec\./.test(file));
const hasPatch = files.some(file => !/(^|\/)(tests?|__tests__)\/|\.test\.|\.spec\./.test(file) && !file.startsWith('.facop/'));
if (!hasTest || !hasPatch) {
  throw new Error(`AI remediation must produce both a patch and a regression/security test. Changed files: ${files.join(', ') || 'none'}`);
}
console.log(`FACoP AI remediation candidate produced ${files.length} changed files and includes patch + regression test. Qualification gates must now decide acceptance.`);
