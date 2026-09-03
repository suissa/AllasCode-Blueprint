import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
function run(command: string, args: string[]): void {
  console.log(`> ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd: root, stdio: 'inherit', env: process.env });
}

run('npm', ['run', 'semantic-tests:materialize']);
run('npx', ['tsx', 'scripts/run-action-test-category.ts', 'unit']);
run('npx', ['tsx', '--test',
  'tests/commerce.test.ts',
  'tests/application-api.test.ts',
  'tests/persistence.test.ts',
  'tests/reliable-event-bus.test.ts',
  'tests/payment-sale-machine-integration.test.ts',
]);
run('npm', ['run', 'e2e:acceptance']);
run('npm', ['run', 'security:audit']);
run('npx', ['tsx', '--test', 'tests/security-hardening.test.ts']);

const report = {
  protocol: 'FACoP',
  profile: 'stage',
  status: 'passed',
  generated_at: new Date().toISOString(),
  ownership: 'upstream',
  evidence: [
    'Action unit contracts',
    'Project-owned integration tests',
    'Project-owned E2E product acceptance',
    'Dependency security audit',
    'Project-owned security hardening tests',
  ],
};
await mkdir(join(root, '.facop'), { recursive: true });
await writeFile(join(root, '.facop', 'stage.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log('FACoP stage acceptance passed.');
