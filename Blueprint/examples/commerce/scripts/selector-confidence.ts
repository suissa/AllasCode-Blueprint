import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { SemanticGraph } from '../runtime/semantic-graph.js';
import { computeSelectorConfidence } from '../runtime/selector-confidence.js';

const root = join(import.meta.dirname, '..');
const graph = JSON.parse(await readFile(join(root,'generated','semantic-graph.json'),'utf8')) as SemanticGraph;
const report = computeSelectorConfidence(graph);
await mkdir(join(root,'tests','dashboard'),{recursive:true});
await writeFile(join(root,'tests','dashboard','selector-confidence.json'),`${JSON.stringify(report,null,2)}\n`,'utf8');
console.log(`Selector confidence: ${report.confidence_percent.toFixed(2)}% (${report.oracle_tests_covered}/${report.oracle_tests_total})`);
for (const scenario of report.scenarios) console.log(`${scenario.name}: recall=${scenario.recall_percent.toFixed(2)}%, missed=${scenario.missed_tests.length}`);
if (!report.passed) {
  const missed = report.scenarios.flatMap(s => s.missed_tests.map(test => `${s.name}: ${test}`));
  throw new Error(`Selector confidence gate requires 100% recall. Missed tests:\n- ${missed.join('\n- ')}`);
}
