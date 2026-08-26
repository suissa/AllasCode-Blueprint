import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { compileSemanticGraph, validateSemanticGraph, type SemanticGraph, type SemanticGraphEdge, type SemanticGraphNode } from './semantic-graph.js';
import type { ActionImplementation, ActionManifest } from './types.js';
import type { ToolImplementation } from './tool-registry.js';
import { governSemanticGraph } from './semantic-governor.js';

interface ResultManifest {
  name: string;
  results: { Ok: string; Error: string };
  contract?: { events?: string };
}

interface ListenerDefinition {
  listeners?: Array<{ event: string; dispatch: string }>;
}

interface SemanticAlternative {
  source: string;
  target: string;
  equivalent?: boolean;
  substitutable?: boolean;
  fallback_on?: string[];
  preserve?: Record<string, unknown>;
}

interface GovernanceCatalog {
  contexts?: Array<{ id: string; agent: string }>;
  capabilities?: Array<{ id: string; required_by?: string[]; implemented_by?: string[] }>;
  policies?: Array<{ id: string; applies_to?: string[] }>;
  invariants?: Array<{ id: string; entity: string; preserved_by?: string[] }>;
  laws?: Array<{ id: string; preserved_by_flows?: string[] }>;
  constraints?: Array<{ id: string; constrains?: string[]; protects?: string[] }>;
  semantic_alternatives?: SemanticAlternative[];
}

function edgeId(type: string, from: string, to: string, ordinal = 0): string {
  return `${type}:${from}->${to}${ordinal ? `#${ordinal}` : ''}`;
}

async function yaml<T>(path: string): Promise<T> {
  return parse(await readFile(path, 'utf8')) as T;
}

async function dirs(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
}

function ensureNode(graph: SemanticGraph, type: string, label: string, metadata?: Record<string, unknown>): string {
  const id = `${type}:${label}`;
  if (!graph.nodes.some(node => node.id === id)) graph.nodes.push({ id, type, label, ...(metadata ? { metadata } : {}) } as unknown as SemanticGraphNode);
  return id;
}

function ensureEvent(graph: SemanticGraph, event: string): void { ensureNode(graph, 'Event', event); }

function addEdge(graph: SemanticGraph, type: string, from: string, to: string, metadata?: Record<string, unknown>, ordinal = 0): void {
  if (graph.edges.some(edge => edge.type === type && edge.from === from && edge.to === to && JSON.stringify(edge.metadata ?? {}) === JSON.stringify(metadata ?? {}))) return;
  graph.edges.push({ id: edgeId(type, from, to, ordinal), type, from, to, ...(metadata ? { metadata } : {}) });
}

function label(id: string): string {
  const separator = id.indexOf(':');
  return separator >= 0 ? id.slice(separator + 1) : id;
}

function order(edge: SemanticGraphEdge): number { return Number(edge.metadata?.order ?? 0); }

function validateEventChoreography(graph: SemanticGraph): string[] {
  const errors: string[] = [];
  const agentIds = new Set(graph.nodes.filter(node => node.type === 'Agent').map(node => node.id));
  const actionIds = new Set(graph.nodes.filter(node => node.type === 'Action').map(node => node.id));

  for (const edge of graph.edges.filter(edge => edge.type === 'LISTENS')) {
    if (!agentIds.has(edge.from)) errors.push(`${edge.id} source must be an Agent`);
    const dispatches = graph.edges.filter(candidate => candidate.type === 'DISPATCHES' && candidate.from === edge.to && candidate.metadata?.agent === label(edge.from));
    if (dispatches.length === 0) errors.push(`${label(edge.from)} listens to ${label(edge.to)} but dispatches no Action`);
    for (const dispatch of dispatches) {
      if (!actionIds.has(dispatch.to)) errors.push(`${dispatch.id} targets unknown Action ${dispatch.to}`);
      const allowed = graph.edges.some(candidate => candidate.type === 'ALLOWS_ACTION' && candidate.from === edge.from && candidate.to === dispatch.to);
      if (!allowed) errors.push(`${label(edge.from)} dispatches ${label(dispatch.to)} without ALLOWS_ACTION`);
      const owner = graph.edges.some(candidate => candidate.type === 'ACTION_OWNER' && candidate.from === dispatch.to && candidate.to === edge.from);
      if (!owner) errors.push(`${label(edge.from)} dispatches Action ${label(dispatch.to)} owned by another Agent`);
    }
  }

  for (const flow of graph.nodes.filter(node => node.type === 'Flow')) {
    const emitted = graph.edges.filter(edge => edge.from === flow.id && edge.type === 'FLOW_EMITS_EVENT').sort((a, b) => order(a) - order(b));
    const expected = graph.edges.filter(edge => edge.from === flow.id && edge.type === 'FLOW_EXPECTS_EVENT').sort((a, b) => order(a) - order(b));
    const terminal = expected.at(-1)?.to;
    const initial = emitted.at(0)?.to;
    if (!initial) errors.push(`${flow.id} has no initial emitted Event`);
    else if (!graph.edges.some(edge => edge.type === 'LISTENS' && edge.to === initial)) errors.push(`${flow.id} starts with ${initial}, but no Agent listens to it`);

    const calledActions = graph.edges.filter(edge => edge.from === flow.id && edge.type === 'FLOW_CALLS_ACTION').map(edge => edge.to);
    for (const actionId of calledActions) {
      const ok = graph.edges.find(edge => edge.type === 'EMITS_OK' && edge.from === actionId)?.to;
      if (!ok) continue;
      if (ok !== terminal && !graph.edges.some(edge => edge.type === 'LISTENS' && edge.to === ok)) errors.push(`${actionId} emits ${ok} inside ${flow.id}, but no downstream Agent listens to it`);
    }
  }
  return errors;
}

async function compileProperties(root: string, graph: SemanticGraph): Promise<void> {
  for (const folder of await dirs(join(root, 'entities'))) {
    const manifest = await yaml<{ id: string }>(join(root, 'entities', folder, 'manifest.yml'));
    const properties = await yaml<Record<string, unknown>>(join(root, 'entities', folder, 'properties.yml'));
    for (const [name, valueType] of Object.entries(properties)) {
      const propertyId = ensureNode(graph, 'Property', `${manifest.id}.${name}`, { valueType });
      addEdge(graph, 'HAS_PROPERTY', `Entity:${manifest.id}`, propertyId);
    }
  }
}

async function compileEventSchemas(root: string, graph: SemanticGraph): Promise<void> {
  for (const folder of await dirs(join(root, 'actions'))) {
    const manifest = await yaml<ResultManifest>(join(root, 'actions', folder, 'manifest.yml'));
    const schemaId = ensureNode(graph, 'Schema', `${manifest.name}.events`, { path: `actions/${folder}/${manifest.contract?.events ?? 'schema/events.yml'}` });
    for (const event of [manifest.results.Ok, manifest.results.Error]) {
      ensureEvent(graph, event);
      addEdge(graph, 'VALIDATED_BY', `Event:${event}`, schemaId);
    }
  }
}

function targetId(raw: string): string {
  if (raw.includes(':')) return raw;
  throw new Error(`Governance target must be typed: ${raw}`);
}

async function compileGovernance(root: string, graph: SemanticGraph): Promise<void> {
  const catalog = await yaml<GovernanceCatalog>(join(root, 'governance', 'catalog.yml'));

  for (const context of catalog.contexts ?? []) {
    const contextId = ensureNode(graph, 'Context', context.id);
    addEdge(graph, 'BOUND_TO', `Agent:${context.agent}`, contextId);
  }
  for (const capability of catalog.capabilities ?? []) {
    const capabilityId = ensureNode(graph, 'Capability', capability.id);
    for (const action of capability.required_by ?? []) addEdge(graph, 'REQUIRES', `Action:${action}`, capabilityId);
    for (const implementation of capability.implemented_by ?? []) {
      const actorId = `Actor:${implementation}`;
      const toolId = `Tool:${implementation}`;
      addEdge(graph, 'IMPLEMENTS', graph.nodes.some(node => node.id === actorId) ? actorId : toolId, capabilityId);
    }
  }
  for (const policy of catalog.policies ?? []) {
    const policyId = ensureNode(graph, 'Policy', policy.id);
    for (const target of policy.applies_to ?? []) addEdge(graph, 'GOVERNED_BY', targetId(target), policyId);
  }
  for (const invariant of catalog.invariants ?? []) {
    const invariantId = ensureNode(graph, 'Invariant', invariant.id);
    addEdge(graph, 'GUARDED_BY', `Entity:${invariant.entity}`, invariantId);
    for (const action of invariant.preserved_by ?? []) addEdge(graph, 'PRESERVES', `Action:${action}`, invariantId);
  }
  for (const law of catalog.laws ?? []) {
    const lawId = ensureNode(graph, 'Law', law.id);
    for (const flow of law.preserved_by_flows ?? []) addEdge(graph, 'PRESERVES_LAW', `Flow:${flow}`, lawId);
  }
  for (const constraint of catalog.constraints ?? []) {
    const constraintId = ensureNode(graph, 'Constraint', constraint.id);
    for (const action of constraint.constrains ?? []) addEdge(graph, 'CONSTRAINED_BY', `Action:${action}`, constraintId);
    for (const invariant of constraint.protects ?? []) addEdge(graph, 'PROTECTS', constraintId, `Invariant:${invariant}`);
  }
  for (const alternative of catalog.semantic_alternatives ?? []) {
    const source = `Action:${alternative.source}`;
    const target = `Action:${alternative.target}`;
    const metadata = { preserve: alternative.preserve ?? {} };
    if (alternative.equivalent) {
      addEdge(graph, 'SEMANTICALLY_EQUIVALENT_TO', source, target, metadata);
      addEdge(graph, 'SEMANTICALLY_EQUIVALENT_TO', target, source, metadata);
    }
    if (alternative.substitutable) addEdge(graph, 'SUBSTITUTABLE_BY', source, target, metadata);
    if ((alternative.fallback_on ?? []).length) addEdge(graph, 'FALLBACK_TO', source, target, { ...metadata, on: alternative.fallback_on });
  }
}

export async function compileRuntimeSemanticGraph(root: string): Promise<SemanticGraph> {
  const graph = await compileSemanticGraph(root);
  for (const folder of await dirs(join(root, 'actions'))) {
    const manifest = await yaml<ResultManifest>(join(root, 'actions', folder, 'manifest.yml'));
    ensureEvent(graph, manifest.results.Ok);
    ensureEvent(graph, manifest.results.Error);
    addEdge(graph, 'EMITS_ERROR', `Action:${manifest.name}`, `Event:${manifest.results.Error}`);
  }
  for (const folder of await dirs(join(root, 'tools'))) {
    const manifest = await yaml<ResultManifest>(join(root, 'tools', folder, 'manifest.yml'));
    ensureEvent(graph, manifest.results.Ok);
    ensureEvent(graph, manifest.results.Error);
    addEdge(graph, 'TOOL_EMITS_OK', `Tool:${manifest.name}`, `Event:${manifest.results.Ok}`);
    addEdge(graph, 'TOOL_EMITS_ERROR', `Tool:${manifest.name}`, `Event:${manifest.results.Error}`);
  }
  for (const folder of await dirs(join(root, 'agents'))) {
    const manifest = await yaml<{ name: string }>(join(root, 'agents', folder, 'manifest.yml'));
    const listeners = await yaml<ListenerDefinition>(join(root, 'agents', folder, 'listeners.yml'));
    for (const [ordinal, listener] of (listeners.listeners ?? []).entries()) {
      ensureEvent(graph, listener.event);
      addEdge(graph, 'LISTENS', `Agent:${manifest.name}`, `Event:${listener.event}`, undefined, ordinal);
      addEdge(graph, 'DISPATCHES', `Event:${listener.event}`, `Action:${listener.dispatch}`, { agent: manifest.name }, ordinal);
    }
  }
  await compileProperties(root, graph);
  await compileEventSchemas(root, graph);
  await compileGovernance(root, graph);

  graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
  graph.edges.sort((a, b) => a.id.localeCompare(b.id));
  const governance = governSemanticGraph(graph);
  const errors = [...validateSemanticGraph(graph), ...validateEventChoreography(graph), ...governance.errors];
  if (errors.length) throw new Error(`Invalid runtime semantic graph:\n- ${errors.join('\n- ')}`);
  return graph;
}

export async function loadCompiledSemanticGraph(root: string): Promise<SemanticGraph> {
  const graph = JSON.parse(await readFile(join(root, 'generated', 'semantic-graph.json'), 'utf8')) as SemanticGraph;
  const governance = governSemanticGraph(graph);
  const errors = [...validateSemanticGraph(graph), ...validateEventChoreography(graph), ...governance.errors];
  if (errors.length) throw new Error(`Invalid compiled semantic graph:\n- ${errors.join('\n- ')}`);
  return graph;
}

function kebab(value: string): string { return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase(); }
function nodes(graph: SemanticGraph, type: SemanticGraphNode['type']): SemanticGraphNode[] { return graph.nodes.filter(node => node.type === type); }
function edgesFrom(graph: SemanticGraph, from: string, type: string): SemanticGraphEdge[] { return graph.edges.filter(edge => edge.from === from && edge.type === type); }
function edgeTo(graph: SemanticGraph, from: string, type: string): SemanticGraphEdge {
  const matches = edgesFrom(graph, from, type);
  if (matches.length !== 1) throw new Error(`${from} must have exactly one ${type} edge, found ${matches.length}`);
  return matches[0]!;
}
async function executableExport<T extends { execute: unknown }>(path: string): Promise<T> {
  const module = await import(pathToFileURL(path).href) as Record<string, unknown>;
  const candidate = Object.values(module).find(value => typeof value === 'object' && value !== null && 'execute' in value && typeof (value as { execute?: unknown }).execute === 'function');
  if (!candidate) throw new Error(`No executable export found in ${path}`);
  return candidate as T;
}

export interface GraphActionBinding { agent: string; manifest: ActionManifest; implementation: ActionImplementation; }
export interface GraphToolBinding { name: string; ok: string; error: string; implementation: ToolImplementation; }
export interface GraphActorDefinition { name: string; agent: string; actions: string[]; mailboxCapacity: number; }
export interface GraphAgentDefinition { name: string; actor: string; actions: string[]; tools: string[]; }
export interface RuntimeGraphProjection { actions: GraphActionBinding[]; tools: GraphToolBinding[]; actors: GraphActorDefinition[]; agents: GraphAgentDefinition[]; }

export async function projectRuntimeFromGraph(root: string, graph: SemanticGraph): Promise<RuntimeGraphProjection> {
  const actions: GraphActionBinding[] = [];
  for (const node of nodes(graph, 'Action')) {
    const owner = label(edgeTo(graph, node.id, 'ACTION_OWNER').to);
    const ok = label(edgeTo(graph, node.id, 'EMITS_OK').to);
    const error = label(edgeTo(graph, node.id, 'EMITS_ERROR').to);
    actions.push({ agent: owner, manifest: { name: node.label, semantic_id: node.semantic_id ?? node.id, results: { Ok: ok, Error: error } }, implementation: await executableExport<ActionImplementation>(join(root, 'actions', kebab(node.label), 'implementation', 'implementation.js')) });
  }
  const tools: GraphToolBinding[] = [];
  for (const node of nodes(graph, 'Tool')) {
    const ok = label(edgeTo(graph, node.id, 'TOOL_EMITS_OK').to);
    const error = label(edgeTo(graph, node.id, 'TOOL_EMITS_ERROR').to);
    tools.push({ name: node.label, ok, error, implementation: await executableExport<ToolImplementation>(join(root, 'tools', kebab(node.label), 'implementation', 'implementation.js')) });
  }
  const actors: GraphActorDefinition[] = [];
  for (const node of nodes(graph, 'Actor')) {
    const ownerEdges = graph.edges.filter(edge => edge.type === 'OWNS_ACTOR' && edge.to === node.id);
    if (ownerEdges.length !== 1) throw new Error(`${node.id} must have exactly one owning Agent, found ${ownerEdges.length}`);
    actors.push({ name: node.label, agent: label(ownerEdges[0]!.from), actions: edgesFrom(graph, node.id, 'ACCEPTS_ACTION').map(edge => label(edge.to)).sort(), mailboxCapacity: Number(node.metadata?.mailboxCapacity ?? 32) });
  }
  const agents: GraphAgentDefinition[] = [];
  for (const node of nodes(graph, 'Agent')) agents.push({ name: node.label, actor: label(edgeTo(graph, node.id, 'OWNS_ACTOR').to), actions: edgesFrom(graph, node.id, 'ALLOWS_ACTION').map(edge => label(edge.to)).sort(), tools: edgesFrom(graph, node.id, 'ALLOWS_TOOL').map(edge => label(edge.to)).sort() });
  return { actions, tools, actors, agents };
}
