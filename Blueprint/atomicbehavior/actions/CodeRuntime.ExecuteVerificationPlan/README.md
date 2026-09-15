# CodeRuntime.ExecuteVerificationPlan

Execute a bounded verification plan against an isolated candidate and return content-addressed runtime evidence.

## Authority

- Actor role: CodeRuntimeAgent
- Mode: read_only_verification
- Reads: CandidateArtifact, VerificationPlan, candidate hash, sandbox policy, environment snapshot
- Writes: none

This Action is a single bounded state transition. It listens to one injected request and emits exactly one fixed terminal event: CodeRuntime.ExecuteVerificationPlan.Ok or CodeRuntime.ExecuteVerificationPlan.Error.

## Semantic contract

Preconditions:

- candidate_hash_is_valid
- verification_plan_is_bounded
- sandbox_policy_is_available

Invariants:

- INV-RUN-001: verification executes without production writes or network authority.
- INV-RUN-002: candidate hash and environment snapshot hash are preserved.
- INV-RUN-003: a timeout is evidence, not a successful verification.

It must never:

- write production artifacts.
- access undeclared network endpoints.
- treat timeout as success.

## Skill projections

- Authoring Skill: skills/authoring/SKILL.md
- Semantic Skill: skills/semantics/SKILL.md
