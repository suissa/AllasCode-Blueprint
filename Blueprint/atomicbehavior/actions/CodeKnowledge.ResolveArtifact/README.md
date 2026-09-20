# CodeKnowledge.ResolveArtifact

Resolve code and observability signals to versioned canonical artifacts without guessing under ambiguity.

## Authority

- Actor role: `CodeKnowledgeAgent`
- Mode: `read_only`
- Reads: ObservationEnvelope, artifact manifests, semantic graph, source index, configuration index
- Writes: nothing

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `CodeKnowledge.ResolveArtifact.Ok` or `CodeKnowledge.ResolveArtifact.Error`.

## Semantic contract

Preconditions:

- `observation_envelope_hash_is_valid`
- `artifact_index_is_versioned`

Invariants:

- **INV-ARTRES-001:** version, language, artifact kind, and canonical identity filters run before similarity ranking.
- **INV-ARTRES-002:** confidence below threshold yields ambiguous or unknown, never an invented identity.
- **INV-ARTRES-003:** the resolver is read-only and cannot change the evidence it ranks.

It must never:

- select only from terminal error text.
- hide contradictory candidates.
- grant capabilities.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
