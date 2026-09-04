import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { readFile } from 'node:fs/promises';
import type { ActionImplementation, ActionManifest } from './types.js';
import type { ToolImplementation } from './tool-registry.js';

interface ToolManifest {
  name: string;
  results: { Ok: string; Error: string };
}

interface ActorManifest {
  name: string;
  actions: string[];
}

interface ActorConfig {
  mailbox_capacity?: number;
}

interface AgentManifest {
  name: string;
  actor: string;
}

interface AgentCapabilities {
  actions?: string[];
  tools?: string[];
}

export interface LoadedTool {
  name: string;
  ok: string;
  error: string;
  implementation: ToolImplementation;
}

export interface LoadedActor {
  name: string;
  actions: string[];
  mailboxCapacity: number;
}

export interface LoadedAgent {
  name: string;
  actor: string;
  actions: string[];
  tools: string[];
}

export interface LoadedAction {
  folder: string;
  ownerAgent: string;
  manifest: ActionManifest;
  implementation: ActionImplementation;
}

async function loadYaml<T>(path: string): Promise<T> {
  return parse(await readFile(path, 'utf8')) as T;
}

async function directories(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
}

function executableExport<T extends { execute: unknown }>(module: Record<string, unknown>, source: string): T {
  const candidate = Object.values(module).find(value => {
    return typeof value === 'object' && value !== null && 'execute' in value && typeof (value as { execute?: unknown }).execute === 'function';
  });
  if (!candidate) throw new Error(`No executable export found in ${source}`);
  return candidate as T;
}

export async function loadTools(root: string): Promise<LoadedTool[]> {
  const base = join(root, 'tools');
  const result: LoadedTool[] = [];
  for (const folder of await directories(base)) {
    const manifest = await loadYaml<ToolManifest>(join(base, folder, 'manifest.yml'));
    const implementationPath = join(base, folder, 'implementation', 'implementation.js');
    const module = await import(pathToFileURL(implementationPath).href) as Record<string, unknown>;
    result.push({
      name: manifest.name,
      ok: manifest.results.Ok,
      error: manifest.results.Error,
      implementation: executableExport<ToolImplementation>(module, implementationPath),
    });
  }
  return result;
}

export async function loadActors(root: string): Promise<LoadedActor[]> {
  const base = join(root, 'actors');
  const result: LoadedActor[] = [];
  for (const folder of await directories(base)) {
    const manifest = await loadYaml<ActorManifest>(join(base, folder, 'manifest.yml'));
    const config = await loadYaml<ActorConfig>(join(base, folder, 'config.yml'));
    result.push({
      name: manifest.name,
      actions: manifest.actions ?? [],
      mailboxCapacity: config.mailbox_capacity ?? 32,
    });
  }
  return result;
}

export async function loadAgents(root: string): Promise<LoadedAgent[]> {
  const base = join(root, 'agents');
  const result: LoadedAgent[] = [];
  for (const folder of await directories(base)) {
    const manifest = await loadYaml<AgentManifest>(join(base, folder, 'manifest.yml'));
    const capabilities = await loadYaml<AgentCapabilities>(join(base, folder, 'capabilities.yml'));
    const actorManifest = await loadYaml<ActorManifest>(join(base, folder, manifest.actor));
    result.push({
      name: manifest.name,
      actor: actorManifest.name,
      actions: capabilities.actions ?? [],
      tools: capabilities.tools ?? [],
    });
  }
  return result;
}

export async function loadActions(root: string, agents: LoadedAgent[]): Promise<LoadedAction[]> {
  const base = join(root, 'actions');
  const result: LoadedAction[] = [];
  for (const folder of await directories(base)) {
    const manifest = await loadYaml<ActionManifest>(join(base, folder, 'manifest.yml'));
    const owner = agents.find(agent => agent.actions.includes(manifest.name));
    if (!owner) throw new Error(`No Agent declares action ${manifest.name}`);
    const implementationPath = join(base, folder, 'implementation', 'implementation.js');
    const module = await import(pathToFileURL(implementationPath).href) as Record<string, unknown>;
    result.push({
      folder,
      ownerAgent: owner.name,
      manifest,
      implementation: executableExport<ActionImplementation>(module, implementationPath),
    });
  }
  return result;
}

export async function loadSemanticArchitecture(root: string) {
  const agents = await loadAgents(root);
  const [actors, tools, actions] = await Promise.all([
    loadActors(root),
    loadTools(root),
    loadActions(root, agents),
  ]);
  return { agents, actors, tools, actions };
}
