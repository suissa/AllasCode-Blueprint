import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const repoTests = join(root, '..', '..', 'tests');

async function files(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await files(path)); else out.push(path);
  }
  return out;
}
function hash(parts: string[]): string { return createHash('sha256').update(parts.join('\n')).digest('hex'); }
async function hashFiles(paths: string[]): Promise<string> {
  const parts: string[] = [];
  for (const path of [...paths].sort()) parts.push(`${relative(root,path)}:${await readFile(path,'utf8')}`);
  return hash(parts);
}
const all = await files(root);
const governanceFiles = all.filter(p => p.includes('/governance/') && /\.(ya?ml|json)$/.test(p));
const graphContractFiles = all.filter(p => p.includes('/graph/') || p.endsWith('/config.yml'));
const governanceHash = await hashFiles(governanceFiles);
const graphContractHash = await hashFiles(graphContractFiles);
const schemaHash = hash([await readFile(join(repoTests,'result.schema.json'),'utf8')]);
const results = all.filter(p => p.endsWith('/result.json') && p.includes('/tests/'));
let stamped=0;
for (const path of results) {
  const result = JSON.parse(await readFile(path,'utf8')) as any;
  if (!['passed','failed','error'].includes(result.status)) continue;
  const artifactPath = join(root, String(result.artifact?.path ?? ''));
  let artifactFiles: string[]=[];
  try { if ((await stat(artifactPath)).isDirectory()) artifactFiles=(await files(artifactPath)).filter(p=>!p.includes('/tests/')); else artifactFiles=[artifactPath]; } catch { continue; }
  const implementationFiles=artifactFiles.filter(p=>p.includes('/implementation/') || /\.(ts|js|zig|rs|go|py)$/.test(p));
  const manifestFiles=artifactFiles.filter(p=>/manifest\.ya?ml$/.test(p));
  result.evidence_state = result.status === 'passed' ? 'fresh' : 'invalid';
  result.provenance = {
    algorithm:'sha256',
    artifact_hash:await hashFiles(artifactFiles),
    implementation_hash:await hashFiles(implementationFiles),
    manifest_hash:await hashFiles(manifestFiles),
    governance_hash:governanceHash,
    graph_contract_hash:graphContractHash,
    result_schema_hash:schemaHash,
    runner_version:'allascode-semantic-test-v1'
  };
  await writeFile(path,`${JSON.stringify(result,null,2)}\n`,'utf8'); stamped++;
}
console.log(`Stamped provenance on ${stamped} executed TestResults.`);
