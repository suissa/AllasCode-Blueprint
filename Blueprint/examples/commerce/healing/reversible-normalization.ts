export type NormalizationPhase = 'validation' | 'self-healing';

export interface ReversibleNormalization<Input, Normalized> {
  id: string;
  forward(value: Input): Normalized;
  reverse(value: Normalized): Input;
}

export interface NormalizationEvidence<Input, Normalized> {
  normalization_id: string;
  phase: NormalizationPhase;
  original: Input;
  normalized: Normalized;
  reversed: Input;
  reversible: boolean;
}

export function applyReversibleNormalization<Input, Normalized>(
  phase: NormalizationPhase,
  normalization: ReversibleNormalization<Input, Normalized>,
  value: Input,
  equals: (left: Input, right: Input) => boolean = (left, right) => JSON.stringify(left) === JSON.stringify(right),
): NormalizationEvidence<Input, Normalized> {
  const normalized = normalization.forward(value);
  const reversed = normalization.reverse(normalized);
  const reversible = equals(value, reversed);
  if (!reversible) throw new Error(`Normalization ${normalization.id} is not reversible and cannot be used in ${phase}`);
  return { normalization_id: normalization.id, phase, original: value, normalized, reversed, reversible };
}
