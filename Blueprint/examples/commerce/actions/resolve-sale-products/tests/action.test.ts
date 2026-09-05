import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { resolveSaleProducts } from '../implementation/implementation.js';
import { defineActionTests } from '../../../tests/action-harness.js';
import type { ActionManifest, SaleInput } from '../../../runtime/types.js';

const actionDir = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = parse(readFileSync(join(actionDir, 'manifest.yml'), 'utf8')) as ActionManifest;
const sale = (index = 0): SaleInput => ({ sale_id: `sale-resolve-${index}`, currency: 'BRL', items: [{ product_id: 'water', name: 'Water', quantity: 2, unit_price: 5 }] });

defineActionTests({
  name: manifest.name,
  manifest,
  implementation: resolveSaleProducts,
  actionDir,
  valid: sale,
  invalid: () => ({ sale_id: 'invalid', currency: 'BRL', items: [] }),
});
