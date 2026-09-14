import { createHash } from "node:crypto";

export const BEHAVIORAL_IDENTITY_THEOREMS = Object.freeze([
  {
    id: "CBI-T-SEMANTIC-BEFORE-BEHAVIORAL",
    statement: "Semantic recognition is evaluated independently for every entity.",
  },
  {
    id: "CBI-T-CANONICAL-CHARACTERISTIC-BRIDGE",
    statement:
      "A contextual identity is deterministically derived from its context and canonical participants.",
  },
  {
    id: "CBI-T-CONTEXTUAL-COMPLETION",
    statement:
      "A behavior is complete only when every required identity is provided by a concretized coupling in the same context.",
  },
]);

function evidenceHash(value) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")}`;
}

export function proveBehavioralIdentity(result) {
  const obligations = result.semantic.entities.map((entity) => ({
    theorem: "CBI-T-SEMANTIC-BEFORE-BEHAVIORAL",
    subject: entity.entity,
    context: "semantic",
    status: entity.state === "semantically_identified" ? "proved" : "failed",
    dependencies: entity.canonicalCharacteristics,
    evidence: evidenceHash(entity),
  }));

  for (const coupling of result.couplings) {
    const proved =
      coupling.state === "behaviorally_concretized" &&
      coupling.identityId &&
      coupling.missing.length === 0 &&
      coupling.structuralErrors.length === 0;
    obligations.push({
      theorem: "CBI-T-CANONICAL-CHARACTERISTIC-BRIDGE",
      subject: coupling.name,
      context: coupling.context,
      status: proved ? "proved" : "failed",
      identityId: coupling.identityId,
      dependencies: coupling.participants.map(({ path }) => path).sort(),
      missing: coupling.missing,
      structuralErrors: coupling.structuralErrors,
      evidence: evidenceHash({
        context: coupling.context,
        identityId: coupling.identityId,
        participants: coupling.participants.map(({ path }) => path).sort(),
      }),
    });
  }

  for (const completion of result.completions) {
    obligations.push({
      theorem: "CBI-T-CONTEXTUAL-COMPLETION",
      subject: completion.name,
      context: completion.context,
      status: completion.state === "contextually_complete" ? "proved" : "failed",
      dependencies: completion.required,
      provided: completion.provided,
      missing: completion.missing,
      evidence: evidenceHash(completion),
    });
  }
  return obligations;
}
