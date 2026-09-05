import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','agent-flows');
const modules=['Purchase','Sales','Inventory','Financial','Customer','Supplier','Fiscal','Accounting','Communication','Marketing','Auth','AgentHarness','Reports'];

test('every functional module has exactly one ManagerAgent and explicit Ok/Error tool branches',async()=>{
 const files=(await readdir(root)).filter(f=>f.endsWith('.2flow'));
 assert.deepEqual(files.sort(),modules.map(m=>`${m}.internal-tools.2flow`).sort());
 for(const file of files){
  const text=await readFile(join(root,file),'utf8');
  const managers=[...text.matchAll(/^manager\s+(\w+ManagerAgent)$/gm)];
  assert.equal(managers.length,1,`${file}: exactly one manager`);
  for(const line of text.split(/\r?\n/).filter(l=>/Tool\s*<-/.test(l))) assert.match(line,/Ok\s*\|\s*Error/);
 }
});

test('only module ManagerAgent coordinates sub-agents and tools never invoke agents',async()=>{
 for(const module of modules){
  const text=await readFile(join(root,`${module}.internal-tools.2flow`),'utf8');
  const manager=text.match(/^manager\s+(\w+ManagerAgent)$/m)?.[1];assert.ok(manager);
  for(const line of text.split(/\r?\n/)){
   const call=line.match(/^(\w+Agent)\s+->>\s+(\w+Agent)$/);
   if(call) assert.equal(call[1],manager,`${module}: only manager may call sub-agent`);
   assert.doesNotMatch(line,/^\w+Tool\s+->>\s+\w+Agent$/);
  }
 }
});

test('cross-module ManagerAgent calls are forbidden',async()=>{
 for(const module of modules){
  const text=await readFile(join(root,`${module}.internal-tools.2flow`),'utf8');
  for(const other of modules.filter(m=>m!==module)) assert.equal(new RegExp(`${other}ManagerAgent`).test(text),false,`${module}: direct cross-module manager call forbidden`);
 }
});

test('every Auth Tool resolves to a declared semantic AtomicBehavior',async()=>{
 const text=await readFile(join(root,'Auth.internal-tools.2flow'),'utf8');
 const securityTools=['DpopProofTool','DpopTokenBindingTool','DpopReplayTool','PqEnvelopeTool','PqSignatureTool','KeyRotationTool'];
 const atomicRoot=join(root,'..','atomicbehavior');
 const toolRoot=join(root,'..','tools');
 const declared:string[]=[];
 for(const entry of await readdir(atomicRoot,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  try{const manifest=parse(await readFile(join(atomicRoot,entry.name,'manifest.yml'),'utf8'));if(typeof manifest.name==='string')declared.push(manifest.name);}catch{}
 }
 const executable:string[]=[];
 for(const entry of await readdir(toolRoot,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  try{const manifest=parse(await readFile(join(toolRoot,entry.name,'manifest.yml'),'utf8'));if(typeof manifest.name==='string')executable.push(manifest.name);}catch{}
 }
 for(const tool of securityTools){
  assert.match(text,new RegExp(`^${tool} <- Ok \\| Error$`,'m'));
  assert.ok(declared.includes(tool),`Auth Tool ${tool} has no AtomicBehavior manifest`);
  assert.ok(executable.includes(tool),`Auth Tool ${tool} has no executable Tool manifest`);
 }
});
