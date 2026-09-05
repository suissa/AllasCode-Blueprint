import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const file = new URL('../governance/examples-branch-protection.json', import.meta.url);

test('examples branch protection contract requires semantic-ci before merge', async () => {
  const contract = JSON.parse(await readFile(file, 'utf8')) as {
    branch:string;
    require_pull_request:boolean;
    required_status_checks:string[];
    strict_status_checks:boolean;
    block_on_pending:boolean;
    block_on_failure:boolean;
    semantic_merge_gate:{allow:string;review:string;block:string};
  };
  assert.equal(contract.branch, 'examples');
  assert.equal(contract.require_pull_request, true);
  assert.deepEqual(contract.required_status_checks, ['semantic-ci']);
  assert.equal(contract.strict_status_checks, true);
  assert.equal(contract.block_on_pending, true);
  assert.equal(contract.block_on_failure, true);
  assert.match(contract.semantic_merge_gate.block, /prevent merge/i);
});
