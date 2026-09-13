export const IDENTITY_STATES = Object.freeze({
  SEMANTICALLY_IDENTIFIED: "semantically_identified",
  BEHAVIORALLY_PARTIAL: "behaviorally_partial",
  BEHAVIORALLY_CONCRETIZED: "behaviorally_concretized",
  CONTEXTUALLY_COMPLETE: "contextually_complete",
});

export function validateIdentityCompletion(entityIR, couplings) {
  const behavioralIdentities =
    entityIR.behavioralIdentities ?? entityIR.behavioral_identities ?? [];

  return behavioralIdentities.map((behavioralIdentity) => {
    const name = behavioralIdentity.name ?? behavioralIdentity.identity;
    const required =
      behavioralIdentity.requiresIdentity ??
      behavioralIdentity.requires_identity ??
      behavioralIdentity.requires ??
      [];

    const provided = new Set(
      couplings
        .filter((coupling) => coupling.state === IDENTITY_STATES.BEHAVIORALLY_CONCRETIZED)
        .flatMap((coupling) => [
          coupling.name,
          ...(behavioralIdentity.provides ?? []).map(String),
        ]),
    );

    const missing = required.filter((requirement) => !provided.has(requirement));
    const state =
      missing.length === 0
        ? IDENTITY_STATES.CONTEXTUALLY_COMPLETE
        : IDENTITY_STATES.BEHAVIORALLY_PARTIAL;

    return {
      name,
      context: behavioralIdentity.context,
      required,
      missing,
      state,
      provides: behavioralIdentity.provides ?? [],
    };
  });
}

export function semanticIdentityState(characteristics) {
  return characteristics.length > 0
    ? IDENTITY_STATES.SEMANTICALLY_IDENTIFIED
    : IDENTITY_STATES.BEHAVIORALLY_PARTIAL;
}

