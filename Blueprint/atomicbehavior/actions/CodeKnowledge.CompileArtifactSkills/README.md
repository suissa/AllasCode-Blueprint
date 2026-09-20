# CodeKnowledge.CompileArtifactSkills

Compile each canonical artifact into exactly one authoring Skill and one semantic Skill derived from the same versioned sources.

## Authority

- Actor role: `CodeKnowledgeAgent`
- Mode: `generated_write`
- Reads: artifact manifest, schemas, events, specifications, formalization, implementation metadata, tests
- Writes: `generated/skills/<canonical_label>/authoring/**`, `generated/skills/<canonical_label>/semantics/**`

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `CodeKnowledge.CompileArtifactSkills.Ok` or `CodeKnowledge.CompileArtifactSkills.Error`.

## Semantic contract

Preconditions:

- `artifact_snapshot_is_complete_for_declared_maturity`
- `source_hash_matches_snapshot`

Invariants:

- **INV-SKCOMP-001:** Skills are generated views and never independent sources of semantic truth.
- **INV-SKCOMP-002:** same canonical snapshot and compiler version produce byte-identical output.
- **INV-SKCOMP-003:** authoring and semantics projections remain distinct and source-linked.
- **INV-SKCOMP-004:** a source change invalidates the previous generated hashes.

It must never:

- manually rewrite source semantics during compilation.
- publish only one projection.
- mark draft proof as proved.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
