import { execFileSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { FACOP_ACTION_CATEGORIES, type FacopActionCategory } from '../runtime/facop.js';

const root = join(import.meta.dirname, '..');
const category = process.argv[2] as FacopActionCategory | undefined;
if (!category || !FACOP_ACTION_CATEGORIES.includes(category)) throw new Error(`usage: tsx scripts/run-action-test-category.ts <${FACOP_ACTION_CATEGORIES.join('|')}>`);
const selected = new Set((process.env.FACOP_ACTION_FOLDERS ?? '').split(',').map(value => value.trim()).filter(Boolean));
const entries = await readdir(join(root, 'actions'), { withFileTypes: true });
const files = entries
  .filter(entry => entry.isDirectory() && (!selected.size || selected.has(entry.name)))
  .map(entry => `actions/${entry.name}/tests/action.test.ts`)
  .sort();
if (!files.length) {
  console.log(`No Actions selected for ${category}.`);
  process.exit(0);
}
const pattern = `\\/ ${category}$`;
execFileSync('npx', ['tsx', '--test', '--test-name-pattern', pattern, ...files], { cwd: root, stdio: 'inherit' });
