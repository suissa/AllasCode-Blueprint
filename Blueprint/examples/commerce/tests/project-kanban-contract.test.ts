import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const contract=JSON.parse(readFileSync(join(here,'../governance/project-kanban.json'),'utf8')) as {views:string[];fields:Record<string,string[]>;required_issues:number[];blockers:Record<string,number[]>};

test('v1 project contract contains required views and fields',()=>{
  for(const view of ['Backlog','Ready','In Progress','Review/PR','Blocked','Done','Roadmap v1.0']) assert.ok(contract.views.includes(view));
  assert.deepEqual(Object.keys(contract.fields).sort(),['Area','Phase','Priority','Release']);
  assert.ok(contract.fields.Release?.includes('v1.0'));
});

test('v1 project contract includes roadmap and release blockers',()=>{
  for(const issue of [24,23,64,65,66,67]) assert.ok(contract.required_issues.includes(issue));
  assert.deepEqual(contract.blockers['66'],[23,64,65]);
  assert.ok(contract.blockers['24']?.includes(23));
  assert.ok(contract.blockers['24']?.includes(67));
});
