import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  canonical,
  compileEvidencePlan,
  compileRequirements,
  emitPassport,
  loadProfiles,
  type Evidence,
} from "../runtime/content-addressed-evidence.js";
import type { SemanticGraph } from "../runtime/semantic-graph.js";
const root = join(import.meta.dirname, "..");
const graph = JSON.parse(
  await readFile(join(root, "generated/semantic-graph.json"), "utf8"),
) as SemanticGraph;
const env = "functional:node24-linux-x64";
test("canonical form ignores object key order", () =>
  assert.equal(canonical({ b: 2, a: 1 }), canonical({ a: 1, b: 2 })));
test("discovers requirements dynamically by semantic_id", async () => {
  const rs = await compileRequirements(root, graph, "dev", env);
  assert.equal(
    rs.length,
    graph.nodes.filter((n) => n.type === "Action").length * 5,
  );
  assert.ok(
    rs.some(
      (r) => r.subject.semantic_id === "commerce.action.register-purchase",
    ),
  );
  assert.ok(rs.every((r) => r.evidence_key.startsWith("sha256:")));
});
function ev(
  r: Awaited<ReturnType<typeof compileRequirements>>[number],
): Evidence {
  return {
    schema_version: "allascode.evidence/v1",
    evidence_id: `ev:${r.requirement_id}`,
    evidence_key: r.evidence_key,
    requirement_id: r.requirement_id,
    subject_id: r.subject.semantic_id,
    predicate: r.predicate,
    status: "pass",
    producer: { id: "test-upstream", trust_class: "upstream-ci" },
    profile: r.profile,
    environment_class: r.environment_class,
    input_manifest_digest: r.input_manifest_digest,
    result_digest: "sha256:result",
    attestation: {
      format: "test",
      verified: true,
      producer_id: "test-upstream",
      trust_class: "upstream-ci",
      authorized_profiles: [r.profile],
      envelope_digest: "sha256:envelope",
    },
  };
}
test("executes missing and reuses only verified matching evidence", async () => {
  const first = await compileEvidencePlan({
    root,
    graph,
    artifactId: "commerce",
    profileId: "dev",
    environmentClass: env,
  });
  assert.equal(first.closure.execute_count, first.requirements.length);
  const trusted = first.requirements.map(ev);
  const second = await compileEvidencePlan({
    root,
    graph,
    artifactId: "commerce",
    profileId: "dev",
    environmentClass: env,
    priorEvidence: trusted,
  });
  assert.equal(second.closure.reusable_count, second.requirements.length);
  trusted[0]!.attestation.verified = false;
  const rejected = await compileEvidencePlan({
    root,
    graph,
    artifactId: "commerce",
    profileId: "dev",
    environmentClass: env,
    priorEvidence: trusted,
  });
  assert.equal(rejected.closure.rejected_count, 1);
});
test("Passport identity excludes generated_at", async () => {
  const plan = await compileEvidencePlan({
    root,
    graph,
    artifactId: "commerce",
    profileId: "qualification",
    environmentClass: env,
  });
  const { profiles } = await loadProfiles(root);
  const profile = profiles.get("qualification")!;
  const base = {
    artifactId: "commerce",
    artifactDigest: "sha256:artifact",
    sourceCommit: "commit",
    sourceTree: "tree",
    profile,
    plan,
    evidence: plan.requirements.map(ev),
  };
  assert.equal(
    emitPassport({ ...base, generatedAt: "2026-01-01T00:00:00Z" }).passport_id,
    emitPassport({ ...base, generatedAt: "2026-02-01T00:00:00Z" }).passport_id,
  );
});
