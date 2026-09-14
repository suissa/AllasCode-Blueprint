export const IDENTITY_STATES = Object.freeze({
  SEMANTICALLY_IDENTIFIED: "semantically_identified",
  SEMANTICALLY_PARTIAL: "semantically_partial",
  BEHAVIORALLY_PARTIAL: "behaviorally_partial",
  BEHAVIORALLY_CONCRETIZED: "behaviorally_concretized",
  CONTEXTUALLY_COMPLETE: "contextually_complete",
});

export function entitySemanticIdentityStates(entities, characteristics) {
  return entities.map((entity) => {
    const own = characteristics.filter(
      ({ entity: owner, valid }) => owner === entity.name && valid,
    );
    return {
      entity: entity.name,
      state: own.length > 0
        ? IDENTITY_STATES.SEMANTICALLY_IDENTIFIED
        : IDENTITY_STATES.SEMANTICALLY_PARTIAL,
      canonicalCharacteristics: own.map(({ path }) => path),
    };
  });
}

export function semanticIdentityState(entityStates) {
  return entityStates.length > 0 &&
    entityStates.every(({ state }) => state === IDENTITY_STATES.SEMANTICALLY_IDENTIFIED)
    ? IDENTITY_STATES.SEMANTICALLY_IDENTIFIED
    : IDENTITY_STATES.SEMANTICALLY_PARTIAL;
}

export function validateIdentityCompletion(entityIR, couplings) {
  const behavioralIdentities =
    entityIR.behavioralIdentities ?? entityIR.behavioral_identities ?? [];

  return behavioralIdentities.map((behavioralIdentity) => {
    const name = behavioralIdentity.name ?? behavioralIdentity.identity;
    const context = behavioralIdentity.context;
    const required = (
      behavioralIdentity.requiresIdentity ??
      behavioralIdentity.requires_identity ??
      behavioralIdentity.requires ??
      []
    ).map(String);

    const scoped = couplings.filter(
      (coupling) =>
        coupling.context === context &&
        coupling.state === IDENTITY_STATES.BEHAVIORALLY_CONCRETIZED,
    );
    const provided = new Set(
      scoped.flatMap((coupling) => [coupling.name, ...coupling.provides]),
    );
    const ownCoupling = couplings.find(
      (coupling) => coupling.name === name && coupling.context === context,
    );
    const missing = required.filter((requirement) => !provided.has(requirement));
    const structuralErrors = ownCoupling?.structuralErrors ?? [];
    const ownCouplingResolved =
      !ownCoupling ||
      (ownCoupling.state === IDENTITY_STATES.BEHAVIORALLY_CONCRETIZED);

    return {
      name,
      context,
      required,
      provided: [...provided].sort(),
      missing,
      state:
        missing.length === 0 && structuralErrors.length === 0 && ownCouplingResolved
          ? IDENTITY_STATES.CONTEXTUALLY_COMPLETE
          : IDENTITY_STATES.BEHAVIORALLY_PARTIAL,
      provides: (behavioralIdentity.provides ?? []).map(String),
      contextualIdentityId: ownCoupling?.identityId,
      structuralErrors,
    };
  });
}
