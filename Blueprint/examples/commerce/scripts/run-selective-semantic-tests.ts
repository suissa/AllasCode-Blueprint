import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { SemanticGraph } from '../runtime/semantic-graph.js';
import { buildSelectiveTestPlan } from '../runtime/selective-semantic-tests.js';

const root = join(import.meta.dirname, '..');
const impact = JSON.parse(await readFile(join(root,'tests','dashboard','semantic-impact.json'),'utf8')) as { required_tests:string[] };
const graph = JSON.parse(await readFile(join(root,'generated','semantic-graph.json'),'utf8')) as SemanticGraph;
const plan = buildSelectiveTestPlan(graph, impact.required_tests);
await writeFile(join(root,'tests','dashboard','selective-test-plan.json'),`${JSON.stringify(plan,null,2)}\n`,'utf8');
if (plan.unmapped_tests.length) throw new Error(`Selective runner has unmapped tests:\n- ${plan.unmapped_tests.join('\n- ')}`);

const actionNames = new Set<string>();
const architectureNames = new Set<string>();
for (const testId of plan.action_tests) {
  const testedBy = graph.edges.find(e=>e.type==='TESTED_BY'&&e.to===testId)!;
  actionNames.add(testedBy.from.split(':').slice(1).join(':'));
}
for (const testId of plan.architecture_tests) {
  const testedBy = graph.edges.find(e=>e.type==='TESTED_BY'&&e.to===testId)!;
  architectureNames.add(testedBy.from);
}

if (actionNames.size) {
  const patterns=[...actionNames].sort().map(name=>`actions/${name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()}/tests/action.test.ts`);
  execFileSync('npx',['tsx','--test',...patterns],{cwd:root,stdio:'inherit'});
}
if (architectureNames.size) {
  const pattern=[...architectureNames].sort().map(v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  execFileSync('npx',['tsx','--test','--test-name-pattern',pattern,'tests/architecture-layers.test.ts'],{cwd:root,stdio:'inherit'});
}
console.log(`Selective semantic tests executed: ${plan.required_tests.length} required, ${actionNames.size} Action artifacts, ${architectureNames.size} architecture artifacts.`);
