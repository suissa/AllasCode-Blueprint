# CodeKnowledge.ResolveSkill

Retrieve the smallest trusted bundle of authoring, semantic, protocol, language, and verified healing Skills required by the current context.

## Authority

- Actor role: `CodeKnowledgeAgent`
- Mode: `read_only`
- Reads: ObservationEnvelope, ArtifactResolution, Skill index, causal topology, trust registry
- Writes: nothing

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `CodeKnowledge.ResolveSkill.Ok` or `CodeKnowledge.ResolveSkill.Error`.

## Semantic contract

Preconditions:

- `observation_and_artifact_hashes_are_valid`
- `skill_index_version_is_pinned`

Invariants:

- **INV-SKRES-001:** hard compatibility and trust gates precede lexical, semantic, and topological ranking.
- **INV-SKRES-002:** retrieval cannot expand mutation authority or writable scope.
- **INV-SKRES-003:** exact fingerprints outrank semantic resemblance when both are compatible.
- **INV-SKRES-004:** only the minimum dependency-closed bundle enters context.

It must never:

- load every known Skill.
- auto-install external Skills.
- treat similarity as causal proof.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
