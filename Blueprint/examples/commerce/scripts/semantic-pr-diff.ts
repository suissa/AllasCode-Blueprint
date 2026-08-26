import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { SemanticGraph } from '../runtime/semantic-graph.js';
import { diffSemanticGraphs, renderSemanticPrDiffMarkdown } from '../runtime/semantic-pr-diff.js';

const root = join(import.meta.dirname, '..');
const repoRoot = resolve(root, '..', '..', '..');
const baseRef = process.env.SEMANTIC_DIFF_BASE ?? (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1');
const temp = await mkdtemp(join(tmpdir(), 'allascode-semantic-base-'));
const baseWorktree = join(temp, 'worktree');

try {
  execFileSync('git', ['worktree', 'add', '--detach', baseWorktree, baseRef], { cwd: repoRoot, stdio: 'ignore' });
  const baseCommerce = join(baseWorktree, 'Blueprint', 'examples', 'commerce');
  await symlink(join(root, 'node_modules'), join(baseCommerce, 'node_modules'), 'dir');
  execFileSync(join(root, 'node_modules', '.bin', 'tsx'), ['scripts/build-semantic-graph.ts'], { cwd: baseCommerce, stdio: 'ignore' });

  execFileSync('npm', ['run', 'graph:build'], { cwd: root, stdio: 'ignore' });

  const [baseGraph, headGraph] = await Promise.all([
    readFile(join(baseCommerce, 'generated', 'semantic-graph.json'), 'utf8').then(value => JSON.parse(value) as SemanticGraph),
    readFile(join(root, 'generated', 'semantic-graph.json'), 'utf8').then(value => JSON.parse(value) as SemanticGraph),
  ]);

  const diff = diffSemanticGraphs(baseGraph, headGraph);
  const impact = JSON.parse(await readFile(join(root, 'tests', 'dashboard', 'semantic-impact.json'), 'utf8')) as { risk?: string; risk_score?: number; required_tests?: string[] };
  const confidence = JSON.parse(await readFile(join(root, 'tests', 'dashboard', 'selector-confidence.json'), 'utf8')) as { confidence_percent?: number };
  const markdown = renderSemanticPrDiffMarkdown(diff, {
    risk: impact.risk,
    risk_score: impact.risk_score,
    required_tests: impact.required_tests?.length ?? 0,
    confidence_percent: confidence.confidence_percent,
  });

  await writeFile(join(root, 'tests', 'dashboard', 'semantic-pr-diff.json'), `${JSON.stringify(diff, null, 2)}\n`, 'utf8');
  await writeFile(join(root, 'tests', 'dashboard', 'semantic-pr-diff.md'), markdown, 'utf8');
  console.log(`Semantic PR diff: +${diff.summary.node_additions}/-${diff.summary.node_removals} nodes, +${diff.summary.edge_additions}/-${diff.summary.edge_removals} edges, breaking=${diff.summary.breaking_changes}`);
} finally {
  try { execFileSync('git', ['worktree', 'remove', '--force', baseWorktree], { cwd: repoRoot, stdio: 'ignore' }); } catch {}
  await rm(temp, { recursive: true, force: true });
}
