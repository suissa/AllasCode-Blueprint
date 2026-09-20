---
name: CodeKnowledge.ResolveSkill.authoring
description: "Create, modify, and test the CodeKnowledge.ResolveSkill AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.ResolveSkill
skill_type: authoring
source_manifest: ../../manifest.yml
---

# CodeKnowledge.ResolveSkill — Authoring Skill

Use this Skill whenever creating or changing the `CodeKnowledge.ResolveSkill` artifact.

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
3. Keep write authority limited to: `[]`.
4. Add a counterexample and new proof obligations before changing validated semantics.
5. Test every success, failure, ambiguity and authority-boundary scenario.
6. Regenerate both Skills from the same source snapshot and verify their hashes.

## Mandatory invariants

- `INV-SKRES-001`: hard compatibility and trust gates precede lexical, semantic, and topological ranking.
- `INV-SKRES-002`: retrieval cannot expand mutation authority or writable scope.
- `INV-SKRES-003`: exact fingerprints outrank semantic resemblance when both are compatible.
- `INV-SKRES-004`: only the minimum dependency-closed bundle enters context.

## Forbidden authoring outcomes

- load every known Skill.
- auto-install external Skills.
- treat similarity as causal proof.
- Do not rename terminal events; they remain `CodeKnowledge.ResolveSkill.Ok` and `CodeKnowledge.ResolveSkill.Error`.
- Do not mark the proof as proved without independent executable evidence.
