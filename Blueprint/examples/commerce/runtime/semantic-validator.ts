import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { LoadedAction, LoadedActor, LoadedAgent, LoadedTool } from './semantic-loader.js';

interface EntityManifest {
  id: string;
  relations?: Record<string, string>;
}

interface IntentDefinition {
  id: string;
  'starts-with'?: string;
  success?: string;
  failure?: string;
}

export interface SemanticValidationReport {
  valid: boolean;
  errors: string[];
  entities: string[];
  intents: string[];
  events: string[];
  flows: string[];
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

function relationTarget(value: string): string {
  return value.replace(/\[[^\]]*\]$/, '');
}

async function loadEntityManifests(root: string): Promise<EntityManifest[]> {
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
    const definition = await yaml<IntentDefinition>(join(base, file));
    if (definition?.id) result.push(definition);
  }
  return result;
}

async function loadEvents(root: string): Promise<Set<string>> {
  const base = join(root, 'events');
  const events = new Set<string>(['Ok', 'Error']);
  for (const file of await yamlFiles(base)) {
    const document = await yaml<Record<string, unknown>>(join(base, file));
    const declared = document.events;
    if (declared && typeof declared === 'object' && !Array.isArray(declared)) {
      for (const event of Object.keys(declared as Record<string, unknown>)) events.add(event);
    }
  }
  return events;
}

async function loadFlows(root: string): Promise<Array<{ name: string; source: string }>> {
  const base = join(root, 'flows');
  const entries = await readdir(base, { withFileTypes: true });
  const files = entries.filter(entry => entry.isFile() && entry.name.endsWith('.2flow')).map(entry => entry.name).sort();
  return Promise.all(files.map(async name => ({ name, source: await readFile(join(base, name), 'utf8') })));
}

export async function validateSemanticArchitecture(
  root: string,
  architecture: { agents: LoadedAgent[]; actors: LoadedActor[]; tools: LoadedTool[]; actions: LoadedAction[] },
): Promise<SemanticValidationReport> {
  const [entities, intents, events, flows] = await Promise.all([
    loadEntityManifests(root), loadIntents(root), loadEvents(root), loadFlows(root),
  ]);

  const errors: string[] = [];
  const entityNames = new Set(entities.map(entity => entity.id));
  const agentNames = new Set(architecture.agents.map(agent => agent.name));
  const actorNames = new Set(architecture.actors.map(actor => actor.name));
  const toolNames = new Set(architecture.tools.map(tool => tool.name));
  const actionNames = new Set(architecture.actions.map(action => action.manifest.name));
  const intentNames = new Set(intents.map(intent => intent.id));

  for (const entity of entities) {
    for (const [relation, rawTarget] of Object.entries(entity.relations ?? {})) {
      const target = relationTarget(rawTarget);
      if (!entityNames.has(target)) errors.push(`Entity ${entity.id} relation ${relation} references unknown Entity ${target}`);
    }
  }

  for (const agent of architecture.agents) {
    if (!actorNames.has(agent.actor)) errors.push(`Agent ${agent.name} references unknown Actor ${agent.actor}`);
    for (const action of agent.actions) if (!actionNames.has(action)) errors.push(`Agent ${agent.name} declares unknown Action ${action}`);
    for (const tool of agent.tools) if (!toolNames.has(tool)) errors.push(`Agent ${agent.name} declares unknown Tool ${tool}`);
    const actor = architecture.actors.find(candidate => candidate.name === agent.actor);
    for (const action of agent.actions) {
      if (actor && !actor.actions.includes(action)) errors.push(`Agent ${agent.name} allows ${action}, but Actor ${actor.name} does not`);
    }
  }

  for (const actor of architecture.actors) {
    const owners = architecture.agents.filter(agent => agent.actor === actor.name);
    if (owners.length !== 1) errors.push(`Actor ${actor.name} must have exactly one owning Agent, found ${owners.length}`);
    for (const action of actor.actions) if (!actionNames.has(action)) errors.push(`Actor ${actor.name} accepts unknown Action ${action}`);
  }

  for (const action of architecture.actions) {
    if (!agentNames.has(action.ownerAgent)) errors.push(`Action ${action.manifest.name} references unknown owner Agent ${action.ownerAgent}`);
    const owners = architecture.agents.filter(agent => agent.actions.includes(action.manifest.name));
    if (owners.length !== 1) errors.push(`Action ${action.manifest.name} must belong to exactly one Agent, found ${owners.length}`);
  }

  for (const intent of intents) {
    if (intent['starts-with'] && !events.has(intent['starts-with'])) errors.push(`Intent ${intent.id} starts with undeclared Event ${intent['starts-with']}`);
    if (intent.success && !events.has(intent.success)) errors.push(`Intent ${intent.id} succeeds with undeclared Event ${intent.success}`);
  }

  for (const flow of flows) {
    const lines = flow.source.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const flowIntent = lines[0];
    if (!intentNames.has(flowIntent)) errors.push(`Flow ${flow.name} references unknown Intent ${flowIntent}`);
    let previousAction: LoadedAction | undefined;
    for (const line of lines.slice(1)) {
      if (line.includes('.Error -> Error')) continue;
      if (line.startsWith('->>')) {
        const key = line.slice(3).trim();
        const separator = key.indexOf('.');
        if (separator < 1) { errors.push(`Flow ${flow.name} has invalid action target ${key}`); continue; }
        const agent = key.slice(0, separator);
        const action = key.slice(separator + 1);
        const definition = architecture.actions.find(candidate => candidate.ownerAgent === agent && candidate.manifest.name === action);
        if (!definition) errors.push(`Flow ${flow.name} calls unresolved ${key}`);
        previousAction = definition;
      } else if (line.startsWith('<-')) {
        const expected = line.slice(2).trim();
        if (!previousAction) errors.push(`Flow ${flow.name} expects ${expected} without a preceding Action`);
        else if (previousAction.manifest.results.Ok !== expected) errors.push(`Flow ${flow.name} expects ${expected} after ${previousAction.manifest.name}, but manifest declares ${previousAction.manifest.results.Ok}`);
        if (!events.has(expected)) errors.push(`Flow ${flow.name} references undeclared Event ${expected}`);
      } else if (line.startsWith('->')) {
        const event = line.slice(2).trim();
        if (!events.has(event)) errors.push(`Flow ${flow.name} emits undeclared Event ${event}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    entities: [...entityNames].sort(),
    intents: [...intentNames].sort(),
    events: [...events].sort(),
    flows: flows.map(flow => flow.name),
  };
}

export function assertSemanticArchitecture(report: SemanticValidationReport): void {
  if (!report.valid) throw new Error(`Invalid semantic architecture:\n- ${report.errors.join('\n- ')}`);
}
