import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SemanticGraph } from '../runtime/semantic-graph.js';
import type { SemanticImpactReport } from '../runtime/semantic-impact.js';
import {
  compileFacopEvidencePlan,
  computeFacopEvidenceKey,
  currentFacopEnvironment,
  discoverFacopActions,
  loadFacopConfig,
  type FacopEvidencePassport,
  type FacopProfileName,
} from '../runtime/facop.js';

const root = join(import.meta.dirname, '..');
const profile = (process.argv[2] ?? process.env.FACOP_PROFILE ?? 'dev') as FacopProfileName;
const allowed = new Set<FacopProfileName>(['local', 'dev', 'stage', 'qualification', 'upstream']);
if (!allowed.has(profile)) throw new Error(`Unknown FACoP profile ${profile}`);

const graph = JSON.parse(await readFile(join(root, 'generated', 'semantic-graph.json'), 'utf8')) as SemanticGraph;
const impact = JSON.parse(await readFile(join(root, 'tests', 'dashboard', 'semantic-impact.json'), 'utf8')) as SemanticImpactReport;
const config = await loadFacopConfig(root);
const actions = await discoverFacopActions(root, config);
const environment = currentFacopEnvironment();
const keys = new Map<string, string>();
for (const action of actions) keys.set(action.semantic_id, await computeFacopEvidenceKey(root, action, config, environment));

let previous: FacopEvidencePassport | undefined;
const previousPath = process.env.FACOP_PREVIOUS_PASSPORT;
if (previousPath) {
  try { previous = JSON.parse(await readFile(previousPath, 'utf8')) as FacopEvidencePassport; }
  catch (error) { throw new Error(`Cannot read previous Evidence Passport ${previousPath}: ${String(error)}`); }
}

const plan = compileFacopEvidencePlan({ config, graph, impact, profile, actions, keys, ...(previous ? { previous } : {}), environment });
await mkdir(join(root, '.facop'), { recursive: true });
await mkdir(join(root, 'tests', 'dashboard'), { recursive: true });
await writeFile(join(root, '.facop', 'plan.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
await writeFile(join(root, 'tests', 'dashboard', 'facop-plan.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

const executeFolders = plan.decisions.filter(item => item.decision === 'execute').map(item => item.folder).join(',');
const reusedSubjects = plan.decisions.filter(item => item.decision === 'reuse').map(item => item.subject).join(',');
console.log(`FACoP ${profile}: selected=${plan.summary.selected} execute=${plan.summary.execute} reuse=${plan.summary.reuse}`);
if (executeFolders) console.log(`Execute Action folders: ${executeFolders}`);
if (reusedSubjects) console.log(`Reuse Evidence: ${reusedSubjects}`);

if (process.env.GITHUB_OUTPUT) {
  const output = `profile=${profile}\nexecute_actions=${executeFolders}\nreused_subjects=${reusedSubjects}\nselected=${plan.summary.selected}\nexecute=${plan.summary.execute}\nreuse=${plan.summary.reuse}\n`;
  await import('node:fs/promises').then(({ appendFile }) => appendFile(process.env.GITHUB_OUTPUT!, output, 'utf8'));
}

if (process.argv.includes('--print-tree')) {
  try { console.log(`tree=${execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: join(root, '..', '..', '..'), encoding: 'utf8' }).trim()}`); }
  catch { /* local archives may not contain Git metadata */ }
}
