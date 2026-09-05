import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { parse } from "yaml";
import type { SemanticGraph } from "./semantic-graph.js";

export type Category =
  | "unit"
  | "integration"
  | "e2e"
  | "security"
  | "benchmark"
  | "load"
  | "stress"
  | "chaos";
export type EvidenceStatus =
  "pass" | "fail" | "not-applicable" | "missing" | "expired" | "revoked";
export interface Profile {
  id: string;
  version: string;
  owner: string;
  categories: Category[];
  scope: string;
  reuse: string;
  require_complete_closure?: boolean;
  emit_passport?: boolean;
}
export interface Requirement {
  schema_version: "allascode.evidence-requirement/v1";
  requirement_id: string;
  subject: { semantic_id: string; node_id: string; kind: "Action" };
  predicate: { id: string; version: string; category: Category };
  profile: string;
  ownership: string;
  disposition: "required" | "characterize";
  semantic_inputs: { node_id: string; digest: string }[];
  execution_inputs: { path: string; digest: string }[];
  environment_class: string;
  input_manifest_digest: string;
  evidence_key: string;
}
export interface Evidence {
  schema_version: "allascode.evidence/v1";
  evidence_id: string;
  evidence_key: string;
  requirement_id: string;
  subject_id: string;
  predicate: Requirement["predicate"];
  status: EvidenceStatus;
  reason?: string | null;
  producer: { id: string; trust_class: string };
  profile: string;
  environment_class: string;
  input_manifest_digest: string;
  result_digest: string;
  expires_at?: string;
  attestation: {
    format: string;
    verified: boolean;
    producer_id: string;
    trust_class: string;
    authorized_profiles: string[];
    envelope_digest: string;
  };
}
export interface Decision {
  requirement_id: string;
  candidate_evidence_id?: string;
  decision: "execute" | "reuse" | "reject";
  reason_codes: string[];
}
export interface EvidencePlan {
  schema_version: "allascode.evidence-plan/v1";
  plan_id: string;
  artifact_id: string;
  profile: string;
  environment_class: string;
  changed_artifacts: string[];
  seed_nodes: string[];
  impacted_nodes: string[];
  requirements: Requirement[];
  decisions: Decision[];
  closure: {
    required_count: number;
    reusable_count: number;
    execute_count: number;
    rejected_count: number;
    complete: boolean;
  };
}
interface Config {
  predicates: Record<
    Category,
    { id: string; version: string; disposition: "required" | "characterize" }
  >;
  profiles: Record<string, Omit<Profile, "id">>;
  shared_inputs?: { path: string; categories: Category[] }[];
}
interface Manifest {
  name: string;
  semantic_id: string;
  validation?: Partial<
    Record<
      Category,
      {
        disposition: "required" | "characterize" | "not-applicable";
        predicate?: string;
        reason?: string;
      }
    >
  >;
}
const hash = (v: string | Buffer) =>
  `sha256:${createHash("sha256").update(v).digest("hex")}`;
export function canonical(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non-finite canonical number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  throw new Error(`unsupported canonical value ${typeof value}`);
}
async function exists(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
async function walk(p: string): Promise<string[]> {
  if (!(await exists(p))) return [];
  if ((await stat(p)).isFile()) return [p];
  const out: string[] = [];
  for (const e of await readdir(p, { withFileTypes: true })) {
    const q = join(p, e.name);
    if (e.isDirectory()) out.push(...(await walk(q)));
    else if (e.isFile()) out.push(q);
  }
  return out.sort();
}
async function digest(root: string, p: string) {
  const bytes = await readFile(p);
  if (/\.(json|ya?ml)$/i.test(p)) {
    const doc = /\.json$/i.test(p)
      ? JSON.parse(bytes.toString())
      : parse(bytes.toString());
    return {
      path: relative(root, p).replaceAll("\\", "/"),
      digest: hash(canonical(doc)),
    };
  }
  return { path: relative(root, p).replaceAll("\\", "/"), digest: hash(bytes) };
}
const slug = (v: string) =>
  v
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
export async function loadProfiles(root: string) {
  const config = parse(
    await readFile(join(root, "evidence/profiles.yml"), "utf8"),
  ) as Config;
  return {
    config,
    profiles: new Map(
      Object.entries(config.profiles).map(([id, p]) => [
        id,
        { id, ...p } as Profile,
      ]),
    ),
  };
}
function semanticClosure(
  graph: SemanticGraph,
  seed: string,
  category: Category,
) {
  if (["unit", "benchmark", "load", "stress", "chaos"].includes(category))
    return [seed];
  const allowed = new Set([
    "ACTION_OWNER",
    "ACCEPTS_ACTION",
    "ALLOWS_ACTION",
    "FLOW_CALLS_ACTION",
    "PRESERVES",
    "GOVERNED_BY",
    "CONSTRAINED_BY",
    "REQUIRES",
    "VALIDATED_BY",
  ]);
  const seen = new Set([seed]);
  let front = [seed];
  while (front.length) {
    const next: string[] = [];
    for (const id of front)
      for (const e of graph.edges) {
        if (!allowed.has(e.type)) continue;
        const n = e.from === id ? e.to : e.to === id ? e.from : undefined;
        if (n && !seen.has(n)) {
          seen.add(n);
          next.push(n);
        }
      }
    front = next;
  }
  return [...seen].sort();
}
export async function compileRequirements(
  root: string,
  graph: SemanticGraph,
  profileId: string,
  environmentClass: string,
): Promise<Requirement[]> {
  const { config, profiles } = await loadProfiles(root);
  const profile = profiles.get(profileId);
  if (!profile) throw new Error(`unknown profile ${profileId}`);
  if (profileId === "upstream") return [];
  const ids = new Set<string>();
  const out: Requirement[] = [];
  for (const node of graph.nodes
    .filter((n) => n.type === "Action")
    .sort((a, b) => a.id.localeCompare(b.id))) {
    const folder =
      typeof node.metadata?.source_path === "string"
        ? node.metadata.source_path.split("/").at(-1)!
        : slug(node.label);
    const actionRoot = join(root, "actions", folder);
    const manifest = parse(
      await readFile(join(actionRoot, "manifest.yml"), "utf8"),
    ) as Manifest;
    if (ids.has(manifest.semantic_id))
      throw new Error(`EVIDENCE_SUBJECT_DUPLICATE: ${manifest.semantic_id}`);
    ids.add(manifest.semantic_id);
    for (const category of profile.categories) {
      const declared = manifest.validation?.[category];
      if (declared?.disposition === "not-applicable") {
        if (!declared.reason)
          throw new Error(
            `EVIDENCE_NOT_APPLICABLE_UNJUSTIFIED: ${manifest.semantic_id}/${category}`,
          );
        continue;
      }
      const base = config.predicates[category];
      if (!base) throw new Error(`missing predicate ${category}`);
      const predicateParts = declared?.predicate?.split("@");
      const predicateId = predicateParts?.[0] ?? base.id;
      const predicateVersion = predicateParts?.[1] ?? base.version;
      const semantic_inputs = semanticClosure(graph, node.id, category).map(
        (node_id) => ({
          node_id,
          digest: hash(
            canonical(graph.nodes.find((n) => n.id === node_id) ?? node_id),
          ),
        }),
      );
      const local = (await walk(actionRoot)).filter(
        (p) =>
          !p.endsWith("result.json") &&
          (!p.includes("/tests/") || category === "unit"),
      );
      const shared = (config.shared_inputs ?? [])
        .filter((x) => x.categories.includes(category))
        .map((x) => join(root, x.path));
      const execution_inputs = [];
      for (const p of [...new Set([...local, ...shared])].sort())
        if (await exists(p)) execution_inputs.push(await digest(root, p));
      const keyInput = {
        schema_version: "allascode.evidence-key-input/v1",
        subject_id: manifest.semantic_id,
        predicate_id: predicateId,
        predicate_version: predicateVersion,
        environment_class: environmentClass,
        semantic_inputs,
        execution_inputs,
      };
      const input_manifest_digest = hash(canonical(keyInput));
      const evidence_key = hash(
        canonical({ ...keyInput, input_manifest_digest }),
      );
      const requirement_id = `erq:${hash(canonical({ subject: manifest.semantic_id, predicateId, predicateVersion, profileId, environmentClass })).slice(7)}`;
      out.push({
        schema_version: "allascode.evidence-requirement/v1",
        requirement_id,
        subject: {
          semantic_id: manifest.semantic_id,
          node_id: node.id,
          kind: "Action",
        },
        predicate: { id: predicateId, version: predicateVersion, category },
        profile: profileId,
        ownership: profile.owner,
        disposition: declared?.disposition ?? base.disposition,
        semantic_inputs,
        execution_inputs,
        environment_class: environmentClass,
        input_manifest_digest,
        evidence_key,
      });
    }
  }
  return out.sort((a, b) => a.requirement_id.localeCompare(b.requirement_id));
}

export async function enrichEvidenceGraph(
  root: string,
  graph: SemanticGraph,
  environmentClass = "functional:portable",
): Promise<SemanticGraph> {
  const { config, profiles } = await loadProfiles(root);
  for (const profile of [...profiles.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  ))
    graph.nodes.push({
      id: `ValidationProfile:${profile.id}`,
      type: "ValidationProfile",
      label: profile.id,
      metadata: {
        version: profile.version,
        owner: profile.owner,
        scope: profile.scope,
        reuse: profile.reuse,
      },
    });
  for (const [category, predicate] of Object.entries(config.predicates) as [
    Category,
    Config["predicates"][Category],
  ][]) {
    const id = `EvidencePredicate:${predicate.id}@${predicate.version}`;
    graph.nodes.push({
      id,
      type: "EvidencePredicate",
      label: predicate.id,
      metadata: { category, version: predicate.version },
    });
  }
  for (const requirement of await compileRequirements(
    root,
    graph,
    "qualification",
    environmentClass,
  )) {
    graph.nodes.push({
      id: `EvidenceRequirement:${requirement.requirement_id}`,
      type: "EvidenceRequirement",
      label: `${requirement.subject.semantic_id}.${requirement.predicate.category}`,
      metadata: { ...requirement },
    });
    graph.edges.push({
      id: `REQUIRES_EVIDENCE:${requirement.subject.node_id}->EvidenceRequirement:${requirement.requirement_id}`,
      type: "REQUIRES_EVIDENCE",
      from: requirement.subject.node_id,
      to: `EvidenceRequirement:${requirement.requirement_id}`,
    });
    graph.edges.push({
      id: `EVALUATES:EvidenceRequirement:${requirement.requirement_id}->EvidencePredicate:${requirement.predicate.id}@${requirement.predicate.version}`,
      type: "EVALUATES",
      from: `EvidenceRequirement:${requirement.requirement_id}`,
      to: `EvidencePredicate:${requirement.predicate.id}@${requirement.predicate.version}`,
    });
  }
  graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
  graph.edges.sort((a, b) => a.id.localeCompare(b.id));
  return graph;
}
function admission(
  r: Requirement,
  e: Evidence | undefined,
  p: Profile,
  now: Date,
): Decision {
  if (!e)
    return {
      requirement_id: r.requirement_id,
      decision: "execute",
      reason_codes: ["EVIDENCE_REQUIREMENT_MISSING"],
    };
  const x: string[] = [];
  if (e.evidence_key !== r.evidence_key) x.push("EVIDENCE_KEY_MISMATCH");
  if (
    e.predicate.id !== r.predicate.id ||
    e.predicate.version !== r.predicate.version
  )
    x.push("EVIDENCE_PREDICATE_VERSION_MISMATCH");
  if (e.environment_class !== r.environment_class)
    x.push("EVIDENCE_ENVIRONMENT_INCOMPATIBLE");
  if (e.status === "expired" || (e.expires_at && new Date(e.expires_at) <= now))
    x.push("EVIDENCE_EXPIRED");
  if (e.status === "revoked") x.push("EVIDENCE_REVOKED");
  if (!["pass", "not-applicable"].includes(e.status))
    x.push("EVIDENCE_STATUS_NOT_ADMISSIBLE");
  if (e.status === "not-applicable" && !e.reason)
    x.push("EVIDENCE_NOT_APPLICABLE_UNJUSTIFIED");
  if (!e.attestation?.verified) x.push("EVIDENCE_ATTESTATION_INVALID");
  if (!e.attestation?.authorized_profiles.includes(p.id))
    x.push("EVIDENCE_PROFILE_UNAUTHORIZED");
  if (p.reuse === "forbidden") x.push("EVIDENCE_REUSE_FORBIDDEN");
  return {
    requirement_id: r.requirement_id,
    candidate_evidence_id: e.evidence_id,
    decision: x.length ? "reject" : "reuse",
    reason_codes: x,
  };
}
export async function compileEvidencePlan(args: {
  root: string;
  graph: SemanticGraph;
  artifactId: string;
  profileId: string;
  environmentClass: string;
  changedArtifacts?: string[];
  seedNodes?: string[];
  impactedNodes?: string[];
  priorEvidence?: Evidence[];
  now?: Date;
}): Promise<EvidencePlan> {
  const { profiles } = await loadProfiles(args.root);
  const p = profiles.get(args.profileId);
  if (!p) throw new Error(`unknown profile ${args.profileId}`);
  const all = await compileRequirements(
    args.root,
    args.graph,
    args.profileId,
    args.environmentClass,
  );
  const impacted = new Set(args.impactedNodes ?? []);
  const requirements =
    p.scope === "complete-evidence-closure" || !impacted.size
      ? all
      : all.filter((r) => impacted.has(r.subject.node_id));
  const prior = new Map(
    (args.priorEvidence ?? []).map((e) => [
      `${e.subject_id}:${e.predicate.id}:${e.predicate.version}`,
      e,
    ]),
  );
  const decisions = requirements.map((r) =>
    admission(
      r,
      prior.get(
        `${r.subject.semantic_id}:${r.predicate.id}:${r.predicate.version}`,
      ),
      p,
      args.now ?? new Date(),
    ),
  );
  const stable = {
    artifact_id: args.artifactId,
    profile: args.profileId,
    environment_class: args.environmentClass,
    changed_artifacts: [...(args.changedArtifacts ?? [])].sort(),
    seed_nodes: [...(args.seedNodes ?? [])].sort(),
    impacted_nodes: [...(args.impactedNodes ?? [])].sort(),
    requirement_ids: requirements.map((r) => r.requirement_id),
    decisions,
  };
  return {
    schema_version: "allascode.evidence-plan/v1",
    plan_id: `eplan:${hash(canonical(stable)).slice(7)}`,
    artifact_id: args.artifactId,
    profile: args.profileId,
    environment_class: args.environmentClass,
    changed_artifacts: stable.changed_artifacts,
    seed_nodes: stable.seed_nodes,
    impacted_nodes: stable.impacted_nodes,
    requirements,
    decisions,
    closure: {
      required_count: requirements.length,
      reusable_count: decisions.filter((d) => d.decision === "reuse").length,
      execute_count: decisions.filter((d) => d.decision !== "reuse").length,
      rejected_count: decisions.filter((d) => d.decision === "reject").length,
      complete:
        requirements.length > 0 &&
        decisions.every((d) => d.decision === "reuse"),
    },
  };
}
export function emitPassport(args: {
  artifactId: string;
  artifactDigest: string;
  sourceCommit: string;
  sourceTree: string;
  profile: Profile;
  plan: EvidencePlan;
  evidence: Evidence[];
  generatedAt?: string;
}) {
  const by = new Map(args.evidence.map((e) => [e.requirement_id, e]));
  for (const r of args.plan.requirements) {
    const e = by.get(r.requirement_id);
    if (!e) throw new Error(`EVIDENCE_CLOSURE_INCOMPLETE: ${r.requirement_id}`);
    if (
      e.evidence_key !== r.evidence_key ||
      !["pass", "not-applicable"].includes(e.status) ||
      !e.attestation.verified
    )
      throw new Error(`EVIDENCE_REQUIREMENT_CONFLICT: ${r.requirement_id}`);
  }
  const evidence = args.plan.requirements
    .map((r) => by.get(r.requirement_id)!)
    .sort((a, b) => a.requirement_id.localeCompare(b.requirement_id));
  const closure = {
    required: evidence.length,
    executed: args.plan.decisions.filter((d) => d.decision !== "reuse").length,
    reused: args.plan.decisions.filter((d) => d.decision === "reuse").length,
    rejected: args.plan.decisions.filter((d) => d.decision === "reject").length,
    complete: true,
  };
  const stable = {
    artifact: { id: args.artifactId, digest: args.artifactDigest },
    subject_revision: {
      source_commit: args.sourceCommit,
      source_tree: args.sourceTree,
    },
    qualification_profile: {
      id: args.profile.id,
      version: args.profile.version,
    },
    closure,
    evidence,
  };
  return {
    schema_version: "allascode.evidence-passport/v1",
    passport_id: `ep:${hash(canonical(stable)).slice(7)}`,
    ...stable,
    generated_at: args.generatedAt ?? new Date().toISOString(),
  };
}
