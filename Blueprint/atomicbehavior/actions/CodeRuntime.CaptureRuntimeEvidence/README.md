# CodeRuntime.CaptureRuntimeEvidence

Normalize one completed execution's observed streams into provenance-preserving evidence without inferring a cause.

## Authority

- Actor role: CodeRuntimeAgent
- Mode: read_only
- Reads: execution streams, source metadata, execution identity
- Writes: none

This Action is a single bounded state transition. It listens to one injected request and emits exactly one fixed terminal event: CodeRuntime.CaptureRuntimeEvidence.Ok or CodeRuntime.CaptureRuntimeEvidence.Error.

## Semantic contract

Preconditions:

- execution_id_is_known
- all_streams_have_source_metadata
- canonical_serializer_is_versioned

Invariants:

- INV-CAPTURE-001: no root cause or repair is inferred.
- INV-CAPTURE-002: source timestamps and correlation are preserved.
- INV-CAPTURE-003: identical streams serialize to the same evidence hash.

It must never:

- invent missing telemetry.
- rewrite a source claim.
- mutate code or configuration.

## Skill projections

- Authoring Skill: skills/authoring/SKILL.md
- Semantic Skill: skills/semantics/SKILL.md
