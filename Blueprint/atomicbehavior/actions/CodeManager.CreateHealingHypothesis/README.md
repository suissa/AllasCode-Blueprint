# CodeManager.CreateHealingHypothesis

Create an immutable, falsifiable healing hypothesis before any code or configuration mutation.

## Authority

- Actor role: `CodeManager`
- Mode: `read_only`
- Reads: ObservationEnvelope, ArtifactResolution, SkillBundle, Intent topology, alternative causal candidates
- Writes: nothing

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `CodeManager.CreateHealingHypothesis.Ok` or `CodeManager.CreateHealingHypothesis.Error`.

## Semantic contract

Preconditions:

- `all_input_hashes_are_valid`
- `the_complete_failed_intent_is_available`

Invariants:

- **INV-HYP-001:** the CodeManager has no mutation authority.
- **INV-HYP-002:** fault class is exactly code, system, or unknown.
- **INV-HYP-003:** every hypothesis states supporting evidence, contrary or missing evidence, alternatives, predictions, and falsification criteria.
- **INV-HYP-004:** known verified cases are contextual priors, never unconditional commands.

It must never:

- request simultaneous code and config mutation in one experiment.
- derive cause only from the final error.
- write a candidate.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
