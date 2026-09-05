import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import type { ActionManifest } from './types.js';

export async function loadActionManifest(path: string): Promise<ActionManifest> {
  const source = await readFile(path, 'utf8');
  const parsed = parse(source) as ActionManifest;

  if (!parsed?.name || !parsed?.semantic_id || !parsed?.results?.Ok || !parsed?.results?.Error) {
    throw new Error(`Invalid Action manifest: ${path}`);
  }

  return parsed;
}
