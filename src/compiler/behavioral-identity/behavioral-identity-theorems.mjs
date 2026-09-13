export const BEHAVIORAL_IDENTITY_THEOREMS = Object.freeze([
  {
    id: "CBI-T-SEMANTIC-BEFORE-BEHAVIORAL",
    statement:
      "An entity may be semantically identified before it is behaviorally complete for a context.",
  },
  {
    id: "CBI-T-CANONICAL-CHARACTERISTIC-BRIDGE",
    statement:
      "A canonical characteristic is a semantic coupling point, identity bridge, graph edge source, theorem dependency, and convergence participant.",
  },
  {
    id: "CBI-T-CONTEXTUAL-COMPLETION",
    statement:
      "A contextual behavioral identity is complete only when every required identity for the behavior is provided by concretized couplings.",
  },
]);

export function proveBehavioralIdentity(result) {
  const obligations = [];

  if (result.semantic.state !== "semantically_identified") {
    obligations.push({
      theorem: "CBI-T-SEMANTIC-BEFORE-BEHAVIORAL",
      status: "failed",
      reason: "No canonical characteristic or identity key was derived.",
    });
  }

  for (const coupling of result.couplings) {
    obligations.push({
      theorem: "CBI-T-CANONICAL-CHARACTERISTIC-BRIDGE",
      subject: coupling.name,
      status: coupling.missing.length === 0 ? "proved" : "open",
      dependencies: coupling.participants.map((participant) => participant.path),
      missing: coupling.missing,
    });
  }

  for (const completion of result.completions) {
    obligations.push({
      theorem: "CBI-T-CONTEXTUAL-COMPLETION",
      subject: completion.name,
      status: completion.missing.length === 0 ? "proved" : "open",
      dependencies: completion.required,
      missing: completion.missing,
    });
  }

  return obligations;
}

