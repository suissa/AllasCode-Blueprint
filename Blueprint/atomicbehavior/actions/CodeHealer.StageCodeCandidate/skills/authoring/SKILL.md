---
name: CodeHealer.StageCodeCandidate.authoring
description: "Create, modify, and test the CodeHealer.StageCodeCandidate AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeHealer.StageCodeCandidate
skill_type: authoring
source_manifest: ../../manifest.yml
---

# CodeHealer.StageCodeCandidate — Authoring Skill

Use this Skill whenever creating or changing the `CodeHealer.StageCodeCandidate` artifact.

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
3. Keep write authority limited to: `<target-action>/implementation/**`.
4. Add a counterexample and new proof obligations before changing validated semantics.
5. Test every success, failure, ambiguity and authority-boundary scenario.
6. Regenerate both Skills from the same source snapshot and verify their hashes.

## Mandatory invariants

- `INV-CODESTAGE-001`: contracts, schemas, invariants, specifications, tests, and Git metadata are read-only.
- `INV-CODESTAGE-002`: the original Intent and its version remain unchanged.
- `INV-CODESTAGE-003`: the candidate cannot promote or verify itself.
- `INV-CODESTAGE-004`: the patch is minimal with respect to the declared causal dimension.

## Forbidden authoring outcomes

- edit tests to make the candidate pass.
- change configs/core.yml.
- commit or merge.
- weaken an invariant.
- Do not rename terminal events; they remain `CodeHealer.StageCodeCandidate.Ok` and `CodeHealer.StageCodeCandidate.Error`.
- Do not mark the proof as proved without independent executable evidence.
