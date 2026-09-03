import { createHash } from 'node:crypto';
import { access, readdir, readFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { parse } from 'yaml';
import type { SemanticGraph } from './semantic-graph.js';
import type { SemanticImpactReport } from './semantic-impact.js';

export const FACOP_ACTION_CATEGORIES = ['unit', 'integration', 'security', 'synk', 'load', 'stress', 'chaos', 'benchmark'] as const;
export type FacopActionCategory = typeof FACOP_ACTION_CATEGORIES[number];
export type FacopProfileName = 'local' | 'dev' | 'stage' | 'qualification' | 'upstream';
export type FacopValidationMode = 'required' | 'characterize' | 'upstream';

export interface FacopProjectConfig {
  version: string;
  protocol: string;
  source_contract?: string;
  subjects: { actions_root: string; identity: 'semantic_id' | 'name' };
  evidence: {
    algorithm: 'sha256';
    expiration_days?: number;
    shared_inputs: string[];
  };
  validation: {
    action: Partial<Record<FacopActionCategory, FacopValidationMode>>;
    system: Record<string, FacopValidationMode>;
  };
  profiles: Record<FacopProfileName, { trust: 'contributor' | 'upstream'; purpose: string; commands?: string[] }>;
}

export interface FacopActionSubject {
  name: string;
  semantic_id: string;
  folder: string;
  path: string;
}

export interface FacopCategoryEvidence {
  status: 'passed' | 'failed' | 'not-applicable';
  mode: FacopValidationMode;
  result_file?: string;
  reason?: string;
  metrics?: unknown[];
}

export interface FacopActionEvidence {
  subject: string;
  action_name: string;
  folder: string;
  evidence_key: string;
  reused: boolean;
  categories: Partial<Record<FacopActionCategory, FacopCategoryEvidence>>;
}

export interface FacopEvidencePassport {
  protocol: 'FACoP';
  version: string;
  generated_at: string;
  commit_sha: string;
  tree_sha: string;
  environment: FacopEnvironment;
  stage: { status: 'passed' | 'failed'; evidence: string[] };
  qualification: { required: number; executed: number; reused: number; missing: number; invalid: number };
  actions: FacopActionEvidence[];
}

export interface FacopEnvironment {
  node: string;
  platform: string;
  arch: string;
  runner_os?: string;
  runner_arch?: string;
}

export interface FacopActionDecision {
  subject: string;
  action_name: string;
  folder: string;
  evidence_key: string;
  decision: 'execute' | 'reuse' | 'not-selected';
  reason: string;
  categories: Partial<Record<FacopActionCategory, FacopValidationMode>>;
}

export interface FacopEvidencePlan {
  protocol: 'FACoP';
  version: string;
  profile: FacopProfileName;
  generated_at: string;
  impact: SemanticImpactReport;
  environment: FacopEnvironment;
  selected_actions: string[];
  decisions: FacopActionDecision[];
  required_executions: string[];
  summary: { selected: number; execute: number; reuse: number; not_selected: number };
}

interface ActionManifestDocument {
  name?: string;
  semantic_id?: string;
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function walk(path: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const current = join(path, entry.name);
    if (entry.isDirectory()) output.push(...await walk(current));
    else if (entry.isFile()) output.push(current);
  }
  return output.sort();
}

function stableActionInput(relativePath: string): boolean {
  const normalized = relativePath.replaceAll('\\', '/');
  if (!normalized.startsWith('tests/')) return true;
  return normalized === 'tests/action.test.ts';
}

export function currentFacopEnvironment(): FacopEnvironment {
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    ...(process.env.RUNNER_OS ? { runner_os: process.env.RUNNER_OS } : {}),
    ...(process.env.RUNNER_ARCH ? { runner_arch: process.env.RUNNER_ARCH } : {}),
  };
}

export async function loadFacopConfig(root: string): Promise<FacopProjectConfig> {
  const document = parse(await readFile(join(root, 'facop.yml'), 'utf8')) as FacopProjectConfig;
  if (document.protocol !== 'FACoP') throw new Error(`Unsupported collaboration protocol ${document.protocol}`);
  if (document.evidence.algorithm !== 'sha256') throw new Error(`Unsupported EvidenceKey algorithm ${document.evidence.algorithm}`);
  return document;
}

export async function discoverFacopActions(root: string, config: FacopProjectConfig): Promise<FacopActionSubject[]> {
  const actionsRoot = join(root, config.subjects.actions_root);
  const entries = await readdir(actionsRoot, { withFileTypes: true });
  const actions: FacopActionSubject[] = [];
  for (const entry of entries.filter(candidate => candidate.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(actionsRoot, entry.name);
    const manifestPath = join(path, 'manifest.yml');
    if (!await exists(manifestPath)) continue;
    const manifest = parse(await readFile(manifestPath, 'utf8')) as ActionManifestDocument;
    const name = String(manifest.name ?? entry.name);
    const semanticId = String(manifest.semantic_id ?? name);
    actions.push({ name, semantic_id: semanticId, folder: entry.name, path });
  }
  return actions;
}

export async function computeFacopEvidenceKey(root: string, action: FacopActionSubject, config: FacopProjectConfig, environment = currentFacopEnvironment()): Promise<string> {
  const hash = createHash(config.evidence.algorithm);
  const localFiles = (await walk(action.path)).filter(file => stableActionInput(relative(action.path, file)));
  const sharedFiles = config.evidence.shared_inputs.map(path => join(root, path));
  const files = [...new Set([...localFiles, ...sharedFiles])].sort();

  for (const file of files) {
    if (!await exists(file)) throw new Error(`EvidenceKey input does not exist: ${relative(root, file)}`);
    hash.update(relative(root, file).replaceAll('\\', '/'));
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }
  hash.update(JSON.stringify({ subject: action.semantic_id, environment }));
  return `sha256:${hash.digest('hex')}`;
}

export function previousEvidenceBySubject(passport: FacopEvidencePassport | undefined): Map<string, FacopActionEvidence> {
  return new Map((passport?.actions ?? []).map(evidence => [evidence.subject, evidence]));
}

function selectedActionNames(graph: SemanticGraph, impact: SemanticImpactReport, profile: FacopProfileName): Set<string> {
  if (profile === 'qualification') return new Set(graph.nodes.filter(node => node.type === 'Action').map(node => node.label));
  if (profile === 'local' || profile === 'dev') {
    return new Set(impact.impacted_nodes
      .map(id => graph.nodes.find(node => node.id === id))
      .filter((node): node is NonNullable<typeof node> => Boolean(node && node.type === 'Action'))
      .map(node => node.label));
  }
  return new Set();
}

export function compileFacopEvidencePlan(input: {
  config: FacopProjectConfig;
  graph: SemanticGraph;
  impact: SemanticImpactReport;
  profile: FacopProfileName;
  actions: FacopActionSubject[];
  keys: Map<string, string>;
  previous?: FacopEvidencePassport;
  environment?: FacopEnvironment;
}): FacopEvidencePlan {
  const selectedNames = selectedActionNames(input.graph, input.impact, input.profile);
  const previous = previousEvidenceBySubject(input.previous);
  const decisions: FacopActionDecision[] = [];

  for (const action of input.actions) {
    const evidenceKey = input.keys.get(action.semantic_id);
    if (!evidenceKey) throw new Error(`Missing EvidenceKey for ${action.semantic_id}`);
    const selected = selectedNames.has(action.name);
    if (!selected) {
      decisions.push({ subject: action.semantic_id, action_name: action.name, folder: action.folder, evidence_key: evidenceKey, decision: 'not-selected', reason: `Profile ${input.profile} does not select this Action`, categories: input.config.validation.action });
      continue;
    }
    const prior = previous.get(action.semantic_id);
    if (input.profile === 'qualification' && prior?.evidence_key === evidenceKey) {
      decisions.push({ subject: action.semantic_id, action_name: action.name, folder: action.folder, evidence_key: evidenceKey, decision: 'reuse', reason: 'Complete EvidenceKey is identical to the previous qualified passport', categories: input.config.validation.action });
    } else {
      decisions.push({ subject: action.semantic_id, action_name: action.name, folder: action.folder, evidence_key: evidenceKey, decision: 'execute', reason: prior ? 'EvidenceKey changed or profile requires fresh contributor evidence' : 'No reusable qualified evidence exists', categories: input.config.validation.action });
    }
  }

  const summary = {
    selected: decisions.filter(item => item.decision !== 'not-selected').length,
    execute: decisions.filter(item => item.decision === 'execute').length,
    reuse: decisions.filter(item => item.decision === 'reuse').length,
    not_selected: decisions.filter(item => item.decision === 'not-selected').length,
  };
  const requiredExecutions = input.config.profiles[input.profile]?.commands ?? [];
  return {
    protocol: 'FACoP',
    version: input.config.version,
    profile: input.profile,
    generated_at: new Date().toISOString(),
    impact: input.impact,
    environment: input.environment ?? currentFacopEnvironment(),
    selected_actions: decisions.filter(item => item.decision !== 'not-selected').map(item => item.subject),
    decisions,
    required_executions: requiredExecutions,
    summary,
  };
}

export function validateFacopCategoryEvidence(category: FacopActionCategory, mode: FacopValidationMode, evidence: FacopCategoryEvidence): string[] {
  const errors: string[] = [];
  if (evidence.status === 'failed') errors.push(`${category} failed`);
  if (mode === 'required' && evidence.status !== 'passed') errors.push(`${category} is required and must pass`);
  if (evidence.status === 'not-applicable' && !evidence.reason?.trim()) errors.push(`${category} is not-applicable without a reason`);
  return errors;
}

export function actionResultPath(root: string, action: FacopActionSubject, category: FacopActionCategory): string {
  return join(action.path, 'tests', category, 'result.json');
}

export function relativeActionResultPath(root: string, action: FacopActionSubject, category: FacopActionCategory): string {
  return relative(root, actionResultPath(root, action, category)).replaceAll('\\', '/');
}

export function actionSubjectFromGraph(graph: SemanticGraph, actionName: string): string {
  const node = graph.nodes.find(candidate => candidate.type === 'Action' && candidate.label === actionName);
  return node?.semantic_id ?? `Action:${actionName}`;
}

export function facopArtifactName(root: string): string {
  return basename(root);
}
