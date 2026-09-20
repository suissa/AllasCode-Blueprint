import {
  deriveCanonicalCharacteristics,
  normalizeEntity,
} from "./canonical-characteristic-deriver.mjs";
import { resolveContextualCouplings } from "./contextual-coupling-engine.mjs";
import {
  entitySemanticIdentityStates,
  semanticIdentityState,
  validateIdentityCompletion,
} from "./identity-completion-validator.mjs";
import { proveBehavioralIdentity } from "./behavioral-identity-theorems.mjs";

export function deriveBehavioralIdentity(entityIR) {
  if (!entityIR || typeof entityIR !== "object") {
    throw new TypeError("entityIR must be an object");
  }

  const entities = (entityIR.entities ?? []).map(normalizeEntity);
  const characteristics = entities.flatMap(deriveCanonicalCharacteristics);
  const validCharacteristics = characteristics.filter(({ valid }) => valid);
  const characteristicIndex = new Map(
    validCharacteristics.map((characteristic) => [characteristic.path, characteristic]),
  );
  const entityStates = entitySemanticIdentityStates(entities, characteristics);
  const couplings = resolveContextualCouplings(entityIR, characteristicIndex);
  const completions = validateIdentityCompletion(entityIR, couplings);

  const diagnostics = [
    ...characteristics
      .filter(({ valid }) => !valid)
      .map(({ path, diagnostic }) => ({ code: "CBI_INVALID_PROPERTY", path, message: diagnostic })),
    ...couplings.flatMap((coupling) => [
      ...coupling.missing.map((path) => ({
        code: "CBI_MISSING_CHARACTERISTIC",
        subject: coupling.name,
        path,
      })),
      ...coupling.structuralErrors.map((message) => ({
        code: "CBI_INVALID_COUPLING",
        subject: coupling.name,
        message,
      })),
    ]),
  ];

  const result = {
    pipelineStep: "4.5 Resolving Contextual Behavioral Identity",
    semantic: {
      state: semanticIdentityState(entityStates),
      entities: entityStates,
      canonicalCharacteristics: characteristics,
    },
    couplings,
    completions,
    diagnostics,
    topology: {
      nodes: [
        ...entities.map((entity) => ({ id: entity.name, type: "entity" })),
        ...couplings
          .filter(({ state }) => state === "behaviorally_concretized")
          .map((coupling) => ({
            id: coupling.identityId,
            label: coupling.name,
            type: "contextual_behavioral_identity",
            context: coupling.context,
          })),
      ],
      edges: couplings.flatMap((coupling) => coupling.graphEdges),
    },
  };

  return { ...result, proofs: proveBehavioralIdentity(result) };
}

export default deriveBehavioralIdentity;
