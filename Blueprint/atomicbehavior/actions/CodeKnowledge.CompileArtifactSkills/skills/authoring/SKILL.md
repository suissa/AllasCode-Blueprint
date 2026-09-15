---
name: CodeKnowledge.CompileArtifactSkills.authoring
description: "Create, modify, and test the CodeKnowledge.CompileArtifactSkills AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.CompileArtifactSkills
skill_type: authoring
source_manifest: ../../manifest.yml
---

# CodeKnowledge.CompileArtifactSkills — Authoring Skill

Use this Skill whenever creating or changing the `CodeKnowledge.CompileArtifactSkills` artifact.

## Required artifact files

- `manifest.yml`, `config.yml`;
- input, output and event schemas;
- immutable contract and scenarios;
- fixed `Ok|Error` events;
- authority law and proof-evidence record;
- contract tests and both Skill projections.

## Authoring procedure

1. Read the manifest, contract, schemas, scenarios, law and existing test evidence completely.
2. Preserve the canonical label and increment the version for a semantic contract change.
3. Keep write authority limited to: `generated/skills/<canonical_label>/authoring/**`, `generated/skills/<canonical_label>/semantics/**`.
4. Add a counterexample and new proof obligations before changing validated semantics.
5. Test every success, failure, ambiguity and authority-boundary scenario.
6. Regenerate both Skills from the same source snapshot and verify their hashes.

## Mandatory invariants

- `INV-SKCOMP-001`: Skills are generated views and never independent sources of semantic truth.
- `INV-SKCOMP-002`: same canonical snapshot and compiler version produce byte-identical output.
- `INV-SKCOMP-003`: authoring and semantics projections remain distinct and source-linked.
- `INV-SKCOMP-004`: a source change invalidates the previous generated hashes.

## Forbidden authoring outcomes

- manually rewrite source semantics during compilation.
- publish only one projection.
- mark draft proof as proved.
- Do not rename terminal events; they remain `CodeKnowledge.CompileArtifactSkills.Ok` and `CodeKnowledge.CompileArtifactSkills.Error`.
- Do not mark the proof as proved without independent executable evidence.
