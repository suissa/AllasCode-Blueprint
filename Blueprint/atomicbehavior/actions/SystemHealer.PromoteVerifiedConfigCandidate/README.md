# SystemHealer.PromoteVerifiedConfigCandidate

Promote one independently verified configuration candidate after an explicit approval gate.

## Authority

- Actor role: SystemHealerAgent
- Mode: bounded_config_write
- Reads: CandidateArtifact, VerificationResult, verification evidence, configuration policy, healable-property declaration
- Writes: configs/core.yml#<authorized-healable-property>

This Action is a single bounded state transition. It listens to one injected request and emits exactly one fixed terminal event: SystemHealer.PromoteVerifiedConfigCandidate.Ok or SystemHealer.PromoteVerifiedConfigCandidate.Error.

## Semantic contract

Preconditions:

- verification_is_supported_and_independent
- verification_hashes_match_candidate
- approval_is_explicit
- config_property_is_declared_healable
- candidate_is_inside_config_scope

Invariants:

- INV-PROMOTECONFIG-001: code and contracts remain read-only.
- INV-PROMOTECONFIG-002: promotion requires independent verification and approval.
- INV-PROMOTECONFIG-003: the promoted value equals the verified candidate value.

It must never:

- promote an unverified candidate.
- modify code.
- change immutable or operator-only properties.

## Skill projections

- Authoring Skill: skills/authoring/SKILL.md
- Semantic Skill: skills/semantics/SKILL.md
