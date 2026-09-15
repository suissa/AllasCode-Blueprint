import { createHash } from "node:crypto";
import { normalizeCharacteristic } from "./canonical-characteristic-deriver.mjs";

function contextualIdentityId(context, participants) {
  const material = JSON.stringify({
    context,
    participants: participants.map(({ path }) => path).sort(),
  });
  return `cbi:sha256:${createHash("sha256").update(material).digest("hex")}`;
}

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
  if (!declaration || typeof declaration !== "object") {
    throw new TypeError("contextual identity declaration must be an object");
  }
  const name = declaration.name ?? declaration.identity ?? declaration.behavioral_identity;
  const context = declaration.context;
  if (!name || !context) {
    throw new TypeError("contextual identity must declare name and context");
  }

  const raw = declaration.couples ?? declaration.couples_with ?? [];
  const couples = Array.isArray(raw) ? raw : Object.values(raw).flat();
  const participants = couples.map((item) =>
    normalizeCharacteristic("", item, "couples_with"),
  );
  const missing = participants
    .filter(({ path }) => !characteristicIndex.has(path))
    .map(({ path }) => path);
  const distinctEntities = new Set(participants.map(({ entity }) => entity));
  const structuralErrors = [];
  if (participants.length > 0 && participants.length < 2) {
    structuralErrors.push("A contextual coupling requires at least two canonical characteristics");
  }
  if (participants.length > 0 && distinctEntities.size < 2) {
    structuralErrors.push("A contextual coupling must join distinct entities");
  }

  const concretized =
    participants.length >= 2 &&
    distinctEntities.size >= 2 &&
    missing.length === 0;
  const identityId = participants.length > 0
    ? contextualIdentityId(context, participants)
    : undefined;

  return {
    name,
    context,
    identityId,
    state: concretized ? "behaviorally_concretized" : "behaviorally_partial",
    participants,
    missing,
    structuralErrors,
    provides: (declaration.provides ?? []).map(String),
    graphEdges: concretized
      ? participants.map(({ path }) => ({
          from: path,
          to: identityId,
          type: "canonical_characteristic_couples_with",
          context,
        }))
      : [],
  };
}
