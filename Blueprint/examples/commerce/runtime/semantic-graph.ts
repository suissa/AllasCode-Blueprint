import { readFile, readdir } from 'node:fs/promises';
import { basename, join, normalize } from 'node:path';
import { parse } from 'yaml';
import { loadSemanticArchitecture } from './semantic-loader.js';
import { validateSemanticArchitecture } from './semantic-validator.js';

export type SemanticNodeType = 'Entity' | 'Intent' | 'Event' | 'Agent' | 'Actor' | 'Action' | 'Tool' | 'Flow';

export interface SemanticGraphNode {
  id: string;
  type: SemanticNodeType;
  label: string;
  semantic_id?: string;
  metadata?: Record<string, unknown>;
}

export interface SemanticGraphEdge {
  id: string;
  type: string;
  from: string;
  to: string;
  metadata?: Record<string, unknown>;
}

export interface SemanticGraph {
  version: '0.1.0';
  nodes: SemanticGraphNode[];
  edges: SemanticGraphEdge[];
}

interface EntityManifest {
  id: string;
  semantic_id?: string;
  relations?: Record<string, string>;
}

interface IntentDefinition {
  id: string;
  semantic_id?: string;
  'starts-with'?: string;
  starts_when?: string;
  success?: string;
  succeeds_when?: string[];
  flow?: string;
}

interface CommerceConfig {
  flows?: Record<string, string>;
}

async function yaml<T>(path: string): Promise<T> {
  return parse(await readFile(path, 'utf8')) as T;
}

async function dirs(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
}

async function yamlFiles(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter(entry => entry.isFile() && /\.ya?ml$/i.test(entry.name)).map(entry => entry.name).sort();
}

function relationTarget(raw: string): string {
  return raw.replace(/\[[^\]]*\]$/, '');
}

function nodeId(type: SemanticNodeType, label: string): string {
  return `${type}:${label}`;
}

function edgeId(type: string, from: string, to: string, ordinal = 0): string {
  return `${type}:${from}->${to}${ordinal ? `#${ordinal}` : ''}`;
}

function sortGraph(graph: SemanticGraph): SemanticGraph {
  graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
  graph.edges.sort((a, b) => a.id.localeCompare(b.id));
  return graph;
}

async function loadEntities(root: string): Promise<EntityManifest[]> {
  const base = join(root, 'entities');
  const result: EntityManifest[] = [];
  for (const folder of await dirs(base)) {
    result.push(await yaml<EntityManifest>(join(base, folder, 'manifest.yml')));
  }
  return result;
}

async function loadIntents(root: string): Promise<IntentDefinition[]> {
  const base = join(root, 'intents');
  const result: IntentDefinition[] = [];
  for (const file of await yamlFiles(base)) {
    const value = await yaml<IntentDefinition>(join(base, file));
    if (value?.id) result.push(value);
    else if ((value as { name?: string })?.name) {
      const legacy = value as IntentDefinition & { name: string };
      result.push({ ...legacy, id: legacy.name });
    }
  }
  return result;
}

async function loadEvents(root: string): Promise<string[]> {
  const base = join(root, 'events');
  const names = new Set<string>(['Ok', 'Error']);
  for (const file of await yamlFiles(base)) {
    const document = await yaml<Record<string, unknown>>(join(base, file));
    const events = document.events;
    if (events && typeof events === 'object' && !Array.isArray(events)) {
      for (const name of Object.keys(events as Record<string, unknown>)) names.add(name);
    }
  }
  return [...names].sort();
}

async function loadConfiguredFlows(root: string): Promise<Array<{ name: string; path: string; source: string }>> {
  const config = await yaml<CommerceConfig>(join(root, 'config.yml'));
  const configured = Object.entries(config.flows ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return Promise.all(configured.map(async ([name, relativePath]) => {
    const path = normalize(join(root, relativePath));
    return { name, path, source: await readFile(path, 'utf8') };
  }));
}

export function validateSemanticGraph(graph: SemanticGraph): string[] {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) errors.push(`Duplicate graph node ${node.id}`);
    nodeIds.add(node.id);
  }
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) errors.push(`Duplicate graph edge ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.from)) errors.push(`Edge ${edge.id} references missing source ${edge.from}`);
    if (!nodeIds.has(edge.to)) errors.push(`Edge ${edge.id} references missing target ${edge.to}`);
  }
  return errors;
}

export async function compileSemanticGraph(root: string): Promise<SemanticGraph> {
  const architecture = await loadSemanticArchitecture(root);
  const validation = await validateSemanticArchitecture(root, architecture);
  if (!validation.valid) throw new Error(`Cannot compile invalid semantic architecture:\n- ${validation.errors.join('\n- ')}`);

  const [entities, intents, events, flows] = await Promise.all([
    loadEntities(root),
    loadIntents(root),
    loadEvents(root),
    loadConfiguredFlows(root),
  ]);

  const graph: SemanticGraph = { version: '0.1.0', nodes: [], edges: [] };
  const addNode = (node: SemanticGraphNode) => graph.nodes.push(node);
  const addEdge = (type: string, from: string, to: string, metadata?: Record<string, unknown>, ordinal = 0) => {
    graph.edges.push({ id: edgeId(type, from, to, ordinal), type, from, to, ...(metadata ? { metadata } : {}) });
  };

  for (const entity of entities) {
    addNode({
      id: nodeId('Entity', entity.id),
      type: 'Entity',
      label: entity.id,
      ...(entity.semantic_id ? { semantic_id: entity.semantic_id } : {}),
    });
  }
  for (const intent of intents) {
    addNode({
      id: nodeId('Intent', intent.id),
      type: 'Intent',
      label: intent.id,
      ...(intent.semantic_id ? { semantic_id: intent.semantic_id } : {}),
    });
  }
  for (const event of events) addNode({ id: nodeId('Event', event), type: 'Event', label: event });
  for (const agent of architecture.agents) addNode({ id: nodeId('Agent', agent.name), type: 'Agent', label: agent.name });
  for (const actor of architecture.actors) addNode({ id: nodeId('Actor', actor.name), type: 'Actor', label: actor.name, metadata: { mailboxCapacity: actor.mailboxCapacity } });
  for (const action of architecture.actions) addNode({ id: nodeId('Action', action.manifest.name), type: 'Action', label: action.manifest.name });
  for (const tool of architecture.tools) addNode({ id: nodeId('Tool', tool.name), type: 'Tool', label: tool.name });
  for (const flow of flows) addNode({ id: nodeId('Flow', flow.name), type: 'Flow', label: flow.name, metadata: { file: basename(flow.path) } });

  for (const entity of entities) {
    let ordinal = 0;
    for (const [relation, raw] of Object.entries(entity.relations ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
      const target = relationTarget(raw);
      const cardinality = raw.slice(target.length);
      addEdge(
        'ENTITY_RELATION',
        nodeId('Entity', entity.id),
        nodeId('Entity', target),
        { relation, ...(cardinality ? { cardinality } : {}) },
        ordinal++,
      );
    }
  }

  for (const agent of architecture.agents) {
    addEdge('OWNS_ACTOR', nodeId('Agent', agent.name), nodeId('Actor', agent.actor));
    agent.actions.slice().sort().forEach(action => addEdge('ALLOWS_ACTION', nodeId('Agent', agent.name), nodeId('Action', action)));
    agent.tools.slice().sort().forEach(tool => addEdge('ALLOWS_TOOL', nodeId('Agent', agent.name), nodeId('Tool', tool)));
  }

  for (const actor of architecture.actors) {
    actor.actions.slice().sort().forEach(action => addEdge('ACCEPTS_ACTION', nodeId('Actor', actor.name), nodeId('Action', action)));
  }

  for (const action of architecture.actions) {
    addEdge('ACTION_OWNER', nodeId('Action', action.manifest.name), nodeId('Agent', action.ownerAgent));
    addEdge('EMITS_OK', nodeId('Action', action.manifest.name), nodeId('Event', action.manifest.results.Ok));
  }

  for (const intent of intents) {
    const start = intent['starts-with'] ?? intent.starts_when;
    if (start && events.includes(start)) addEdge('STARTS_WITH', nodeId('Intent', intent.id), nodeId('Event', start));
    if (intent.success && events.includes(intent.success)) addEdge('SUCCEEDS_WITH', nodeId('Intent', intent.id), nodeId('Event', intent.success));
    for (const success of intent.succeeds_when ?? []) {
      if (events.includes(success)) addEdge('SUCCEEDS_WITH', nodeId('Intent', intent.id), nodeId('Event', success));
    }
  }

  for (const flow of flows) {
    const lines = flow.source.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const intent = lines[0];
    if (intent) addEdge('IMPLEMENTS_INTENT', nodeId('Flow', flow.name), nodeId('Intent', intent));
    let ordinal = 0;
    for (const line of lines.slice(1)) {
      if (line.includes('.Error -> Error')) continue;
      if (line.startsWith('->>')) {
        const key = line.slice(3).trim();
        const dot = key.indexOf('.');
        if (dot > 0) {
          const agent = key.slice(0, dot);
          const action = key.slice(dot + 1);
          addEdge('FLOW_CALLS_AGENT', nodeId('Flow', flow.name), nodeId('Agent', agent), { order: ordinal }, ordinal);
          addEdge('FLOW_CALLS_ACTION', nodeId('Flow', flow.name), nodeId('Action', action), { order: ordinal }, ordinal);
          ordinal++;
        }
      } else if (line.startsWith('<-')) {
        const event = line.slice(2).trim();
        addEdge('FLOW_EXPECTS_EVENT', nodeId('Flow', flow.name), nodeId('Event', event), { order: ordinal }, ordinal++);
      } else if (line.startsWith('->')) {
        const event = line.slice(2).trim();
        addEdge('FLOW_EMITS_EVENT', nodeId('Flow', flow.name), nodeId('Event', event), { order: ordinal }, ordinal++);
      }
    }
  }

  sortGraph(graph);
  const graphErrors = validateSemanticGraph(graph);
  if (graphErrors.length) throw new Error(`Invalid compiled semantic graph:\n- ${graphErrors.join('\n- ')}`);
  return graph;
}
