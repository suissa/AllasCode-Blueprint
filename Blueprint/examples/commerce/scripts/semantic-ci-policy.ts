import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { decideSemanticCiPolicy } from '../runtime/semantic-ci-policy.js';

const root = join(import.meta.dirname, '..');
const impact = JSON.parse(await readFile(join(root,'tests','dashboard','semantic-impact.json'),'utf8')) as { risk:'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'; changed_files:string[] };
const confidence = JSON.parse(await readFile(join(root,'tests','dashboard','selector-confidence.json'),'utf8')) as { confidence_percent:number; missed_tests:number };
const plan = JSON.parse(await readFile(join(root,'tests','dashboard','selective-test-plan.json'),'utf8')) as { unmapped_tests:string[] };

const globalImpact = impact.changed_files.some(file => /\/governance\/|\/graph\/|\/config\.yml$|\/facop\.yml$|\/package\.json$|\/runtime\/(semantic-(graph|governor|impact|ci-policy)|facop)\.ts$|\/scripts\/(semantic-impact|semantic-ci-policy|selector-confidence|run-selective-semantic-tests|facop-plan|facop-qualify|run-facop-qualification|run-facop-stage|run-action-test-category)\.ts$|\.github\/workflows\/commerce-(example|facop-dev|facop-stage|facop-qualification)\.yml$/.test(file.replaceAll('\\','/')));
const decision = decideSemanticCiPolicy({
  risk: impact.risk,
  confidence_percent: confidence.confidence_percent,
  missed_tests: confidence.missed_tests,
  unmapped_tests: plan.unmapped_tests.length,
  global_impact: globalImpact,
});

const report = { ...decision, risk: impact.risk, confidence_percent: confidence.confidence_percent, missed_tests: confidence.missed_tests, unmapped_tests: plan.unmapped_tests.length, global_impact: globalImpact };
await writeFile(join(root,'tests','dashboard','semantic-ci-policy.json'),`${JSON.stringify(report,null,2)}\n`,'utf8');
console.log(`Semantic CI policy: mode=${decision.mode}; ${decision.reason}`);

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `mode=${decision.mode}\nrun_full_actions=${decision.run_full_actions}\nrun_full_architecture=${decision.run_full_architecture}\n`, 'utf8');
}
