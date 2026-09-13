import { normalizeCharacteristic } from "./canonical-characteristic-deriver.mjs";

export function resolveContextualCouplings(entityIR, characteristicIndex) {
  const declarations = [
    ...(entityIR.contextualIdentities ?? entityIR.contextual_identities ?? []),
    ...(entityIR.behavioralIdentities ?? entityIR.behavioral_identities ?? []),
  ];

  return declarations.map((declaration) =>
    resolveCouplingDeclaration(declaration, characteristicIndex),
  );
}

export function resolveCouplingDeclaration(declaration, characteristicIndex) {
  const name = declaration.name ?? declaration.identity ?? declaration.behavioral_identity;
  const context = declaration.context;
  const rawCouples = declaration.couples ?? declaration.couples_with ?? [];
  const couples = Array.isArray(rawCouples)
    ? rawCouples
    : Object.values(rawCouples).flat();

  const participants = couples.map((item) =>
    typeof item === "string" ? normalizeCharacteristic("", item, "couples_with") : item,
  );

  const missing = participants
    .filter((participant) => !characteristicIndex.has(participant.path))
    .map((participant) => participant.path);

  return {
    name,
    context,
    state: missing.length === 0 ? "behaviorally_concretized" : "behaviorally_partial",
    participants,
    missing,
    graphEdges: buildGraphEdges(name, context, participants),
  };
}

export function buildGraphEdges(identityName, context, participants) {
  return participants.map((participant) => ({
    from: participant.path,
    to: identityName,
    type: "canonical_characteristic_couples_with",
    context,
  }));
}

