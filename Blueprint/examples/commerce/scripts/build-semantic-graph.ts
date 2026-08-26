import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileRuntimeSemanticGraph } from '../runtime/runtime-graph.js';
import { validateSemanticGraph } from '../runtime/semantic-graph.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const graph = await compileRuntimeSemanticGraph(root);
const errors = validateSemanticGraph(graph);
if (errors.length) throw new Error(errors.join('\n'));

if (process.argv.includes('--validate')) {
  console.log(`Semantic graph valid: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
} else {
  const output = join(root, 'generated', 'semantic-graph.json');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(graph, null, 2)}\n`, 'utf8');
  console.log(output);
}
