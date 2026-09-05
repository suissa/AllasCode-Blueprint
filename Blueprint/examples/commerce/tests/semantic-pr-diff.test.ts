import test from 'node:test';
import assert from 'node:assert/strict';
import type { SemanticGraph } from '../runtime/semantic-graph.js';
import { diffSemanticGraphs, renderSemanticPrDiffMarkdown } from '../runtime/semantic-pr-diff.js';

const base: SemanticGraph = {
  version: '0.1.0',
  nodes: [
    { id:'Action:A', type:'Action', label:'A', metadata:{ version:1 } },
    { id:'Event:Done', type:'Event', label:'Done' },
  ],
  edges: [
    { id:'EMITS_OK:Action:A->Event:Done', type:'EMITS_OK', from:'Action:A', to:'Event:Done' },
  ],
};

test('semantic diff detects added removed and changed graph elements', () => {
  const head: SemanticGraph = {
    version:'0.1.0',
    nodes:[
      { id:'Action:A', type:'Action', label:'A', metadata:{ version:2 } },
      { id:'Action:B', type:'Action', label:'B' },
    ],
    edges:[
      { id:'FALLBACK_TO:Action:A->Action:B', type:'FALLBACK_TO', from:'Action:A', to:'Action:B' },
    ],
  };
  const diff = diffSemanticGraphs(base, head);
  assert.deepEqual(diff.nodes.added.map(v=>v.id), ['Action:B']);
  assert.deepEqual(diff.nodes.removed.map(v=>v.id), ['Event:Done']);
  assert.deepEqual(diff.nodes.changed.map(v=>v.after.id), ['Action:A']);
  assert.deepEqual(diff.edges.added.map(v=>v.id), ['FALLBACK_TO:Action:A->Action:B']);
  assert.deepEqual(diff.edges.removed.map(v=>v.id), ['EMITS_OK:Action:A->Event:Done']);
  assert.equal(diff.summary.breaking_changes, 3);
});

test('markdown exposes risk tests confidence and graph changes', () => {
  const diff = diffSemanticGraphs(base, base);
  const markdown = renderSemanticPrDiffMarkdown(diff, { risk:'LOW', risk_score:4, required_tests:7, confidence_percent:100 });
  assert.match(markdown, /Semantic PR Diff/);
  assert.match(markdown, /Risk: \*\*LOW\*\*/);
  assert.match(markdown, /Required tests: \*\*7\*\*/);
  assert.match(markdown, /Selector confidence: \*\*100%\*\*/);
});
