# CodeHealer.RevertCandidate

Restore the exact pre-candidate code snapshot when rollback is authorized.

## Authority

- Actor role: CodeHealerAgent
- Mode: bounded_code_write
- Reads: CandidateArtifact, base snapshot, rollback policy, approval reference
- Writes: <target-action>/implementation/**

This Action is a single bounded state transition. It listens to one injected request and emits exactly one fixed terminal event: CodeHealer.RevertCandidate.Ok or CodeHealer.RevertCandidate.Error.

## Semantic contract

Preconditions:

- candidate_is_active
- base_snapshot_is_available
- rollback_is_authorized
- target_matches_code_scope

Invariants:

- INV-REVERT-001: rollback restores the exact base snapshot.
- INV-REVERT-002: configuration and contracts remain read-only.
- INV-REVERT-003: rollback is itself idempotent and content-addressed.

It must never:

- restore an untrusted snapshot.
- modify configuration.
- erase rollback provenance.

## Skill projections

- Authoring Skill: skills/authoring/SKILL.md
- Semantic Skill: skills/semantics/SKILL.md
