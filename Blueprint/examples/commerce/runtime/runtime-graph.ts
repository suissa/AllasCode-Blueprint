import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { compileSemanticGraph, validateSemanticGraph, type SemanticGraph, type SemanticGraphEdge, type SemanticGraphNode } from './semantic-graph.js';
import type { ActionImplementation, ActionManifest } from './types.js';
import type { ToolImplementation } from './tool-registry.js';

interface ResultManifest {
  name: string;
  results: { Ok: string; Error: string };
}

function edgeId(type: string, from: string, to: string): string {
  return `${type}:${from}->${to}`;
}

async function yaml<T>(path: string): Promise<T> {
  return parse(await readFile(path, 'utf8')) as T;
}

async function dirs(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
}

function addEdge(graph: SemanticGraph, type: string, from: string, to: string): void {
  if (graph.edges.some(edge => edge.type === type && edge.from === from && edge.to === to)) return;
  graph.edges.push({ id: edgeId(type, from, to), type, from, to });
}

export async function compileRuntimeSemanticGraph(root: string): Promise<SemanticGraph> {
  const graph = await compileSemanticGraph(root);

  for (const folder of await dirs(join(root, 'actions'))) {
    const manifest = await yaml<ResultManifest>(join(root, 'actions', folder, 'manifest.yml'));
    addEdge(graph, 'EMITS_ERROR', `Action:${manifest.name}`, `Event:${manifest.results.Error}`);
  }

  for (const folder of await dirs(join(root, 'tools'))) {
    const manifest = await yaml<ResultManifest>(join(root, 'tools', folder, 'manifest.yml'));
    addEdge(graph, 'TOOL_EMITS_OK', `Tool:${manifest.name}`, `Event:${manifest.results.Ok}`);
    addEdge(graph, 'TOOL_EMITS_ERROR', `Tool:${manifest.name}`, `Event:${manifest.results.Error}`);
  }

  graph.edges.sort((a, b) => a.id.localeCompare(b.id));
  const errors = validateSemanticGraph(graph);
  if (errors.length) throw new Error(`Invalid runtime semantic graph:\n- ${errors.join('\n- ')}`);
  return graph;
}

export async function loadCompiledSemanticGraph(root: string): Promise<SemanticGraph> {
  const graph = JSON.parse(await readFile(join(root, 'generated', 'semantic-graph.json'), 'utf8')) as SemanticGraph;
  const errors = validateSemanticGraph(graph);
  if (errors.length) throw new Error(`Invalid compiled semantic graph:\n- ${errors.join('\n- ')}`);
  return graph;
}

function kebab(label: string): string {
  return label
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function nodes(graph: SemanticGraph, type: SemanticGraphNode['type']): SemanticGraphNode[] {
  return graph.nodes.filter(node => node.type === type);
}

function edgesFrom(graph: SemanticGraph, from: string, type: string): SemanticGraphEdge[] {
  return graph.edges.filter(edge => edge.from === from && edge.type === type);
}

function edgeTo(graph: SemanticGraph, from: string, type: string): SemanticGraphEdge {
  const matches = edgesFrom(graph, from, type);
  if (matches.length !== 1) throw new Error(`${from} must have exactly one ${type} edge, found ${matches.length}`);
  return matches[0]!;
}

function label(id: string): string {
  const separator = id.indexOf(':');
  return separator >= 0 ? id.slice(separator + 1) : id;
}

async function executableExport<T extends { execute: unknown }>(path: string): Promise<T> {
  const module = await import(pathToFileURL(path).href) as Record<string, unknown>;
  const candidate = Object.values(module).find(value =>
    typeof value === 'object' && value !== null && 'execute' in value && typeof (value as { execute?: unknown }).execute === 'function'
  );
  if (!candidate) throw new Error(`No executable export found in ${path}`);
  return candidate as T;
}

export interface GraphActionBinding {
  agent: string;
  manifest: ActionManifest;
  implementation: ActionImplementation;
}

export interface GraphToolBinding {
  name: string;
  ok: string;
  error: string;
  implementation: ToolImplementation;
}

export interface GraphActorDefinition {
  name: string;
  agent: string;
  actions: string[];
  mailboxCapacity: number;
}

export interface GraphAgentDefinition {
  name: string;
  actor: string;
  actions: string[];
  tools: string[];
}

export interface RuntimeGraphProjection {
  actions: GraphActionBinding[];
  tools: GraphToolBinding[];
  actors: GraphActorDefinition[];
  agents: GraphAgentDefinition[];
}

export async function projectRuntimeFromGraph(root: string, graph: SemanticGraph): Promise<RuntimeGraphProjection> {
  const actions: GraphActionBinding[] = [];
  for (const node of nodes(graph, 'Action')) {
    const owner = label(edgeTo(graph, node.id, 'ACTION_OWNER').to);
    const ok = label(edgeTo(graph, node.id, 'EMITS_OK').to);
    const error = label(edgeTo(graph, node.id, 'EMITS_ERROR').to);
    const path = join(root, 'actions', kebab(node.label), 'implementation', 'implementation.js');
    actions.push({
      agent: owner,
      manifest: { name: node.label, results: { Ok: ok, Error: error } },
      implementation: await executableExport<ActionImplementation>(path),
    });
  }

  const tools: GraphToolBinding[] = [];
  for (const node of nodes(graph, 'Tool')) {
    const ok = label(edgeTo(graph, node.id, 'TOOL_EMITS_OK').to);
    const error = label(edgeTo(graph, node.id, 'TOOL_EMITS_ERROR').to);
    const path = join(root, 'tools', kebab(node.label), 'implementation', 'implementation.js');
    tools.push({ name: node.label, ok, error, implementation: await executableExport<ToolImplementation>(path) });
  }

  const actors: GraphActorDefinition[] = [];
  for (const node of nodes(graph, 'Actor')) {
    const ownerEdges = graph.edges.filter(edge => edge.type === 'OWNS_ACTOR' && edge.to === node.id);
    if (ownerEdges.length !== 1) throw new Error(`${node.id} must have exactly one owning Agent, found ${ownerEdges.length}`);
    actors.push({
      name: node.label,
      agent: label(ownerEdges[0]!.from),
      actions: edgesFrom(graph, node.id, 'ACCEPTS_ACTION').map(edge => label(edge.to)).sort(),
      mailboxCapacity: Number(node.metadata?.mailboxCapacity ?? 32),
    });
  }

  const agents: GraphAgentDefinition[] = [];
  for (const node of nodes(graph, 'Agent')) {
    agents.push({
      name: node.label,
      actor: label(edgeTo(graph, node.id, 'OWNS_ACTOR').to),
      actions: edgesFrom(graph, node.id, 'ALLOWS_ACTION').map(edge => label(edge.to)).sort(),
      tools: edgesFrom(graph, node.id, 'ALLOWS_TOOL').map(edge => label(edge.to)).sort(),
    });
  }

  return { actions, tools, actors, agents };
}
