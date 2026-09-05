import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createExecutionKernel } from '../runtime/execution-kernel.js';
import { governSemanticGraph } from '../runtime/semantic-governor.js';
import { validateSemanticGraph, type SemanticGraph } from '../runtime/semantic-graph.js';

const kernel=await createExecutionKernel();
function clone():SemanticGraph { return structuredClone(kernel.graph); }
const mutations=[
  {name:'remove-agent-context',apply:(g:SemanticGraph)=>{g.edges=g.edges.filter(e=>!(e.type==='BOUND_TO'&&e.from==='Agent:InventoryAgent'));}},
  {name:'remove-invariant-preservation',apply:(g:SemanticGraph)=>{g.edges=g.edges.filter(e=>!(e.type==='PRESERVES'&&e.to==='Invariant:StockNonNegative'));}},
  {name:'remove-event-schema',apply:(g:SemanticGraph)=>{g.edges=g.edges.filter(e=>!(e.type==='VALIDATED_BY'&&e.from==='Event:StockDecreased'));}},
  {name:'remove-action-capability',apply:(g:SemanticGraph)=>{g.edges=g.edges.filter(e=>!(e.type==='REQUIRES'&&e.from==='Action:DecreaseStock'));}},
  {name:'remove-flow-law',apply:(g:SemanticGraph)=>{g.edges=g.edges.filter(e=>!(e.type==='PRESERVES_LAW'&&e.from==='Flow:process-sale'));}},
  {name:'remove-entity-properties',apply:(g:SemanticGraph)=>{g.edges=g.edges.filter(e=>!(e.type==='HAS_PROPERTY'&&e.from==='Entity:Stock'));}},
  {name:'dangling-edge',apply:(g:SemanticGraph)=>{const edge=g.edges.find(e=>e.type==='OWNS_ACTOR'); if(edge) edge.to='Actor:MissingActor';}},
];

test('semantic mutation score detects architectural contract violations',async()=>{
  let killed=0; const details=[];
  for(const mutation of mutations){ const graph=clone(); mutation.apply(graph); const structural=validateSemanticGraph(graph); const governed=governSemanticGraph(graph); const detected=structural.length>0||!governed.allowed; if(detected) killed++; details.push({mutation:mutation.name,detected,structural_errors:structural.length,governance_errors:governed.errors.length}); }
  const score=killed/mutations.length*100;
  await writeFile(join(import.meta.dirname,'dashboard','semantic-mutation.json'),JSON.stringify({generated_at:new Date().toISOString(),mutations:mutations.length,killed,score_percent:score,details},null,2)+'\n');
  assert.equal(score,100,'All canonical semantic graph mutations must be detected');
});
