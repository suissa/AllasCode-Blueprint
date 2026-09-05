import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { SemanticGraph } from '../runtime/semantic-graph.js';
import { analyzeSemanticImpact } from '../runtime/semantic-impact.js';

const root = join(import.meta.dirname, '..');
const base = process.env.SEMANTIC_IMPACT_BASE ?? (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1');
let changed: string[] = [];
try {
  changed = execFileSync('git', ['diff','--name-only',`${base}...HEAD`], { encoding:'utf8', cwd:join(root,'..','..','..') })
    .split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
} catch {
  changed = [];
}
const graph = JSON.parse(await readFile(join(root,'generated','semantic-graph.json'),'utf8')) as SemanticGraph;
const report = analyzeSemanticImpact(graph, changed);
await mkdir(join(root,'tests','dashboard'),{recursive:true});
await writeFile(join(root,'tests','dashboard','semantic-impact.json'),`${JSON.stringify(report,null,2)}\n`,'utf8');
console.log(`Semantic impact: ${report.impacted_nodes.length} nodes, ${report.required_tests.length} tests, risk=${report.risk} (${report.risk_score})`);
const commercePrefix = 'Blueprint/examples/commerce/';
const mappingRequired = changed.filter(file => {
  if (!file.startsWith(commercePrefix)) return false;
  const relative = file.slice(commercePrefix.length);
  return !relative.startsWith('docs/')
    && !relative.endsWith('.md')
    && !relative.endsWith('.mdx');
});
if (report.seed_nodes.length === 0 && mappingRequired.length > 0) {
  throw new Error(`Semantic impact could not map changed commerce files to graph nodes:\n- ${mappingRequired.join('\n- ')}`);
}
