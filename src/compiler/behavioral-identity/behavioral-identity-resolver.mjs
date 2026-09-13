import {
  deriveCanonicalCharacteristics,
  normalizeEntity,
} from "./canonical-characteristic-deriver.mjs";
import { resolveContextualCouplings } from "./contextual-coupling-engine.mjs";
import {
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
  const characteristicIndex = new Map(
    characteristics.map((characteristic) => [characteristic.path, characteristic]),
  );

  const couplings = resolveContextualCouplings(entityIR, characteristicIndex);
  const completions = validateIdentityCompletion(entityIR, couplings);

  const result = {
    pipelineStep: "4.5 Resolving Contextual Behavioral Identity",
    semantic: {
      state: semanticIdentityState(characteristics),
      canonicalCharacteristics: characteristics,
    },
    couplings,
    completions,
    topology: {
      nodes: [
        ...entities.map((entity) => ({ id: entity.name, type: "entity" })),
        ...couplings.map((coupling) => ({
          id: coupling.name,
          type: "contextual_behavioral_identity",
          context: coupling.context,
        })),
      ],
      edges: couplings.flatMap((coupling) => coupling.graphEdges),
    },
  };

  return {
    ...result,
    proofs: proveBehavioralIdentity(result),
  };
}

export default deriveBehavioralIdentity;

