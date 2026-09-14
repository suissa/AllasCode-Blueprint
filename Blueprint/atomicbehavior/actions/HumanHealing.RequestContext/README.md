# HumanHealing.RequestContext

Request the minimum human evidence needed when automatic healing cannot preserve the original Intent with adequate confidence.

## Authority

- Actor role: `HumanHealingAgent`
- Mode: `event_only`
- Reads: HealingHypothesis or unknown diagnosis, evidence gaps, execution checkpoint, original Intent
- Writes: nothing

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `HumanHealing.RequestContext.Ok` or `HumanHealing.RequestContext.Error`.

## Semantic contract

Preconditions:

- `automatic_disposition_is_unknown_or_inconclusive`
- `original_intent_and_checkpoint_are_available`

Invariants:

- **INV-HUMAN-001:** the original Intent is immutable.
- **INV-HUMAN-002:** previously proven successful work is preserved.
- **INV-HUMAN-003:** questions request evidence or authorization, never silently delegate responsibility.
- **INV-HUMAN-004:** lack of confidence cannot trigger speculative mutation.

It must never:

- replace the Intent with an easier objective.
- discard the checkpoint.
- ask for data already present.
- grant write authority.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
