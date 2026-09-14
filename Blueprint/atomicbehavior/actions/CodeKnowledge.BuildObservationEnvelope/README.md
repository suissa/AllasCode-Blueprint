# CodeKnowledge.BuildObservationEnvelope

Build a content-addressed, provenance-preserving envelope from the complete failed Intent execution.

## Authority

- Actor role: `CodeKnowledgeAgent`
- Mode: `read_only`
- Reads: Intent and Action contracts, events, metrics, traces, logs, terminal error, code references, configuration snapshot
- Writes: nothing

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `CodeKnowledge.BuildObservationEnvelope.Ok` or `CodeKnowledge.BuildObservationEnvelope.Error`.

## Semantic contract

Preconditions:

- `execution_id_is_known`
- `intent_contract_is_versioned`
- `all_received_evidence_has_source`

Invariants:

- **INV-OBS-001:** no evidence may be invented, repaired, or normalized into a different claim.
- **INV-OBS-002:** source, timestamp, execution, correlation, and causation provenance are preserved.
- **INV-OBS-003:** canonical serialization of identical evidence produces the same evidence hash.

It must never:

- infer a root cause.
- mutate code or configuration.
- erase contradictory evidence.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
