# HealingVerifier.VerifyCandidate

Independently compare predicted and observed candidate behavior and classify the healing experiment.

## Authority

- Actor role: `HealingVerifier`
- Mode: `read_only_verification`
- Reads: HealingHypothesis, base artifact, candidate artifact, visible and hidden tests, runtime evidence, acceptance contracts
- Writes: nothing

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `HealingVerifier.VerifyCandidate.Ok` or `HealingVerifier.VerifyCandidate.Error`.

## Semantic contract

Preconditions:

- `hypothesis_and_candidate_hashes_are_valid`
- `verifier_is_independent_from_candidate_producer`

Invariants:

- **INV-VERIFY-001:** the proposing Agent cannot verify or promote its own candidate.
- **INV-VERIFY-002:** visible test success alone is insufficient.
- **INV-VERIFY-003:** all original Intent invariants and hidden acceptance obligations remain authoritative.
- **INV-VERIFY-004:** inconclusive evidence never becomes supported.

It must never:

- mutate the candidate.
- change the hypothesis after observing results.
- hide failed tests.
- promote directly.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
