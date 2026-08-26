import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileRuntimeSemanticGraph } from '../runtime/runtime-graph.js';
import { enrichHealingGraph } from '../runtime/healing-graph.js';
import { validateSemanticGraph } from '../runtime/semantic-graph.js';
import { compileSemanticTests } from '../runtime/test-graph.js';
import { governSemanticGraph } from '../runtime/semantic-governor.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const graph = await enrichHealingGraph(root, await compileRuntimeSemanticGraph(root));
const testErrors = await compileSemanticTests(root, graph);
const governance = governSemanticGraph(graph);
const errors = [...validateSemanticGraph(graph), ...testErrors, ...governance.errors];
if (errors.length) throw new Error(errors.join('\n'));

if (process.argv.includes('--validate')) {
  const testNodes = graph.nodes.filter(node => node.type === 'Test').length;
  const resultNodes = graph.nodes.filter(node => node.type === 'TestResult').length;
  const metricNodes = graph.nodes.filter(node => node.type === 'Metric').length;
  const healingNodes = graph.nodes.filter(node => node.type === 'HealingStrategy').length;
  console.log(`Semantic graph valid: ${graph.nodes.length} nodes, ${graph.edges.length} edges; tests=${testNodes}, results=${resultNodes}, metrics=${metricNodes}, healing=${healingNodes}`);
} else {
  const output = join(root, 'generated', 'semantic-graph.json');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(graph, null, 2)}\n`, 'utf8');
  console.log(output);
}
