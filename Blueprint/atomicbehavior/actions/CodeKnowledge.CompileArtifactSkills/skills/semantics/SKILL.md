---
name: CodeKnowledge.CompileArtifactSkills.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of CodeKnowledge.CompileArtifactSkills."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.CompileArtifactSkills
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeKnowledge.CompileArtifactSkills — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `CodeKnowledge.CompileArtifactSkills`.

## Meaning

Compile each canonical artifact into exactly one authoring Skill and one semantic Skill derived from the same versioned sources.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `canonical_label`: `CanonicalLabel`
- `artifact_kind`: `ArtifactKind`
- `artifact_snapshot`: `ArtifactSnapshot`
- `source_hash`: `ContentHash`

## Outputs

- `authoring_skill`: `SkillArtifact`
- `semantics_skill`: `SkillArtifact`
- `index_record`: `SkillIndexRecord`
- `output_hash`: `ContentHash`

## Invariants

- `INV-SKCOMP-001`: Skills are generated views and never independent sources of semantic truth.
- `INV-SKCOMP-002`: same canonical snapshot and compiler version produce byte-identical output.
- `INV-SKCOMP-003`: authoring and semantics projections remain distinct and source-linked.
- `INV-SKCOMP-004`: a source change invalidates the previous generated hashes.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot manually rewrite source semantics during compilation.
- It cannot publish only one projection.
- It cannot mark draft proof as proved.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
