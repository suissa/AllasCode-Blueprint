---
name: CodeKnowledge.ResolveArtifact.authoring
description: "Create, modify, and test the CodeKnowledge.ResolveArtifact AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.ResolveArtifact
skill_type: authoring
source_manifest: ../../manifest.yml
---

# CodeKnowledge.ResolveArtifact — Authoring Skill

Use this Skill whenever creating or changing the `CodeKnowledge.ResolveArtifact` artifact.

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

- `INV-ARTRES-001`: version, language, artifact kind, and canonical identity filters run before similarity ranking.
- `INV-ARTRES-002`: confidence below threshold yields ambiguous or unknown, never an invented identity.
- `INV-ARTRES-003`: the resolver is read-only and cannot change the evidence it ranks.

## Forbidden authoring outcomes

- select only from terminal error text.
- hide contradictory candidates.
- grant capabilities.
- Do not rename terminal events; they remain `CodeKnowledge.ResolveArtifact.Ok` and `CodeKnowledge.ResolveArtifact.Error`.
- Do not mark the proof as proved without independent executable evidence.
