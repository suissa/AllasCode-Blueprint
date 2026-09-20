# CodeHealer.StageCodeCandidate

Stage the smallest code-only candidate authorized by an immutable code-fault hypothesis.

## Authority

- Actor role: `CodeHealerAgent`
- Mode: `bounded_code_write`
- Reads: HealingHypothesis, target Action contract, target implementation, visible tests
- Writes: `<target-action>/implementation/**`

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `CodeHealer.StageCodeCandidate.Ok` or `CodeHealer.StageCodeCandidate.Error`.

## Semantic contract

Preconditions:

- `hypothesis_fault_class_is_code`
- `hypothesis_hash_is_valid`
- `target_matches_authorized_mutation_scope`

Invariants:

- **INV-CODESTAGE-001:** contracts, schemas, invariants, specifications, tests, and Git metadata are read-only.
- **INV-CODESTAGE-002:** the original Intent and its version remain unchanged.
- **INV-CODESTAGE-003:** the candidate cannot promote or verify itself.
- **INV-CODESTAGE-004:** the patch is minimal with respect to the declared causal dimension.

It must never:

- edit tests to make the candidate pass.
- change configs/core.yml.
- commit or merge.
- weaken an invariant.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
