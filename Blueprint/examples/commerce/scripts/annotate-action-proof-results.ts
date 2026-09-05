import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ACTION_PROOF_MATRIX } from '../tests/action-proof-matrix.js';

const root = join(import.meta.dirname, '..', 'actions');

for (const actionDir of await readdir(root, { withFileTypes: true })) {
  if (!actionDir.isDirectory()) continue;
  const testsDir = join(root, actionDir.name, 'tests');
  let types: string[];
  try { types = await readdir(testsDir); } catch { continue; }
  for (const type of types) {
    const resultPath = join(testsDir, type, 'result.json');
    let result: Record<string, any>;
    try { result = JSON.parse(await readFile(resultPath, 'utf8')); } catch { continue; }
    const action = String(result.artifact?.id ?? '');
    const claims = ACTION_PROOF_MATRIX[action]?.[type as keyof (typeof ACTION_PROOF_MATRIX)[string]] ?? [];
    result.proves = result.status === 'passed' ? claims : [];
    result.violates = result.status === 'failed' ? claims : [];
    result.metadata = { ...(result.metadata ?? {}), semantic_proof_matrix: true };
    await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  }
}
console.log('Action test results annotated with semantic PROVES/VIOLATES claims.');
