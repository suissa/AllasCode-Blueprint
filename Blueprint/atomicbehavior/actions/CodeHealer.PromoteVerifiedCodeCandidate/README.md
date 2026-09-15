# CodeHealer.PromoteVerifiedCodeCandidate

Promote one independently verified code candidate after an explicit approval gate.

## Authority

- Actor role: CodeHealerAgent
- Mode: bounded_code_write
- Reads: CandidateArtifact, VerificationResult, verification evidence, target Action contract, branch policy
- Writes: <target-action>/implementation/**

This Action is a single bounded state transition. It listens to one injected request and emits exactly one fixed terminal event: CodeHealer.PromoteVerifiedCodeCandidate.Ok or CodeHealer.PromoteVerifiedCodeCandidate.Error.

## Semantic contract

Preconditions:

- verification_is_supported_and_independent
- verification_hashes_match_candidate
- approval_is_explicit
- target_matches_code_scope

Invariants:

- INV-PROMOTECODE-001: configuration and contracts remain read-only.
- INV-PROMOTECODE-002: promotion requires independent verification and approval.
- INV-PROMOTECODE-003: the promoted content equals the verified candidate byte-for-byte.

It must never:

- promote an unverified candidate.
- change configuration.
- weaken contracts or tests.

## Skill projections

- Authoring Skill: skills/authoring/SKILL.md
- Semantic Skill: skills/semantics/SKILL.md
