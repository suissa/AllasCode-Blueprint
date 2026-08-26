import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import type { SemanticGraph, SemanticGraphNode } from './semantic-graph.js';

interface MetricResult { id: string; label?: string; value: number; unit?: string; }
interface TestResultDocument {
  artifact: { id: string; type: string; path?: string };
  test: { type: string; id?: string };
  status: 'passed' | 'failed' | 'warning' | 'skipped' | 'unknown';
  metrics?: MetricResult[];
  proves?: string[];
  violates?: string[];
}

async function walk(path: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const current = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await walk(current));
    else if (entry.isFile() && entry.name === 'result.json') result.push(current);
  }
  return result.sort();
}

function ensureNode(graph: SemanticGraph, node: SemanticGraphNode): void {
  if (!graph.nodes.some(existing => existing.id === node.id)) graph.nodes.push(node);
}

function addEdge(graph: SemanticGraph, type: string, from: string, to: string, metadata?: Record<string, unknown>): void {
  const id = `${type}:${from}->${to}`;
  if (!graph.edges.some(edge => edge.type === type && edge.from === from && edge.to === to)) {
    graph.edges.push({ id, type, from, to, ...(metadata ? { metadata } : {}) });
  }
}

function validateResult(result: TestResultDocument, file: string): string[] {
  const errors: string[] = [];
  if (!result?.artifact?.id) errors.push(`${file}: artifact.id is required`);
  if (!result?.artifact?.type) errors.push(`${file}: artifact.type is required`);
  if (!result?.test?.type) errors.push(`${file}: test.type is required`);
  if (!['passed','failed','warning','skipped','unknown'].includes(result?.status)) errors.push(`${file}: invalid status`);
  for (const metric of result.metrics ?? []) {
    if (!metric.id) errors.push(`${file}: metric.id is required`);
    if (typeof metric.value !== 'number' || Number.isNaN(metric.value)) errors.push(`${file}: metric ${metric.id} value must be numeric`);
  }
  return errors;
}

function artifactNode(graph: SemanticGraph, result: TestResultDocument): string | undefined {
  const typed = `${result.artifact.type}:${result.artifact.id}`;
  if (graph.nodes.some(node => node.id === typed)) return typed;
  return graph.nodes.find(node => node.label === result.artifact.id)?.id;
}

function governanceNode(graph: SemanticGraph, raw: string): string | undefined {
  return graph.nodes.find(node => ['Invariant','Policy','Law'].includes(node.type) && (node.id === raw || node.label === raw))?.id;
}

export async function compileSemanticTests(root: string, graph: SemanticGraph): Promise<string[]> {
  const errors: string[] = [];
  for (const file of await walk(root)) {
    if (file.includes(`${join('tests','dashboard')}`)) continue;
    let result: TestResultDocument;
    try { result = JSON.parse(await readFile(file, 'utf8')) as TestResultDocument; }
    catch { errors.push(`${file}: invalid JSON`); continue; }
    errors.push(...validateResult(result, file));
    const artifact = artifactNode(graph, result);
    if (!artifact) { errors.push(`${file}: artifact ${result.artifact.type}:${result.artifact.id} not found in Semantic Graph`); continue; }

    const key = `${result.artifact.type}:${result.artifact.id}:${result.test.type}`;
    const testId = `Test:${key}`;
    const resultId = `TestResult:${key}`;
    ensureNode(graph, { id: testId, type: 'Test', label: `${result.artifact.id}.${result.test.type}`, metadata: { testType: result.test.type, path: relative(root, dirname(file)) } });
    ensureNode(graph, { id: resultId, type: 'TestResult', label: `${result.artifact.id}.${result.test.type}.result`, metadata: { status: result.status, file: relative(root, file) } });
    addEdge(graph, 'TESTED_BY', artifact, testId);
    addEdge(graph, 'PRODUCES', testId, resultId);

    for (const metric of result.metrics ?? []) {
      const metricId = `Metric:${key}:${metric.id}`;
      ensureNode(graph, { id: metricId, type: 'Metric', label: metric.label ?? metric.id, metadata: { value: metric.value, ...(metric.unit ? { unit: metric.unit } : {}) } });
      addEdge(graph, 'MEASURES', resultId, metricId);
    }
    for (const proof of result.proves ?? []) {
      const target = governanceNode(graph, proof);
      if (!target) errors.push(`${file}: PROVES target ${proof} is not an Invariant, Policy or Law`);
      else addEdge(graph, 'PROVES', resultId, target);
    }
    for (const violation of result.violates ?? []) {
      const target = governanceNode(graph, violation);
      if (!target) errors.push(`${file}: VIOLATES target ${violation} is not an Invariant, Policy or Law`);
      else addEdge(graph, 'VIOLATES', resultId, target);
    }
  }
  return errors;
}
